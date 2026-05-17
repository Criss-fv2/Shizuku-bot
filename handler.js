import './settings.js'
import chalk from 'chalk'
import print from './lib/print.js'
import { smsg } from './lib/simple.js'
import { database } from './lib/database.js'
import { readdirSync } from 'fs'
import { join, resolve } from 'path'
import { pathToFileURL } from 'url'
import { resolveWho } from './lib/who.js'

const toNum = v => (v + '').replace(/[^0-9]/g, '')
const localPart = v => (v + '').split('@')[0].split(':')[0].split('/')[0].split(',')[0]
const normalizeCore = v => toNum(localPart(v))

function pickOwners() {
    const arr = Array.isArray(global.owner) ? global.owner : []
    return arr.map(v => Array.isArray(v)
        ? { num: normalizeCore(v[0]), root: !!v[2] }
        : { num: normalizeCore(v), root: false }
    )
}

const isOwnerJid     = jid => pickOwners().some(o => o.num === normalizeCore(jid))
const isRootOwnerJid = jid => pickOwners().some(o => o.num === normalizeCore(jid) && o.root)

function isPremiumJid(jid) {
    const num = normalizeCore(jid)
    const prems = Array.isArray(global.prems) ? global.prems.map(normalizeCore) : []
    if (prems.includes(num)) return true
    return !!database.data?.users?.[jid]?.premium
}

const PREFIXES      = ['#', '.', '/', '$']
const IGNORED_WORDS = new Set(['hola','hey','ok','vale','sí','no','si','buenas','buenos','gracias','graciasbot'])

const getPrefix = body => PREFIXES.find(p => body.startsWith(p)) ?? null

const similarity = (a, b) => {
    let m = 0
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] === b[i]) m++
    return Math.floor((m / Math.max(a.length, b.length)) * 100)
}

// ─── Construye mapa cmd → plugin UNA sola vez ─────────────────────────────────
function buildCmdMap(plugins) {
    const map = new Map()
    for (const [, p] of plugins) {
        if (!p?.command) continue
        const list = Array.isArray(p.command) ? p.command
            : typeof p.command === 'string'   ? [p.command]
            : []
        for (const c of list)
            if (typeof c === 'string') map.set(c.toLowerCase(), p)
    }
    return map
}

// ─── Parsea el mensaje y devuelve { commandName, args, usedPrefix } o null ────
function parseMessage(body, cmdMap) {
    const detectedPrefix = getPrefix(body)

    if (detectedPrefix) {
        const rest  = body.slice(detectedPrefix.length).trim()
        if (!rest) return null
        const parts = rest.split(/ +/)
        return {
            commandName: parts.shift().toLowerCase(),
            args:        parts,
            usedPrefix:  detectedPrefix,
            withPrefix:  true
        }
    }

    // Sin prefijo
    const sinprefixEnabled = database.data?.settings?.sinprefix ?? true
    if (!sinprefixEnabled) return null

    const parts     = body.trim().split(/ +/)
    const firstWord = parts[0]?.toLowerCase()

    if (!firstWord)                        return null
    if (IGNORED_WORDS.has(firstWord))      return null
    if (!cmdMap.has(firstWord))            return null   // no es comando → ignorar

    return {
        commandName: firstWord,
        args:        parts.slice(1),
        usedPrefix:  '',
        withPrefix:  false
    }
}

const eventsLoadedFor = new WeakSet()

export const loadEvents = async (conn) => {
    if (!conn?.ev?.on || eventsLoadedFor.has(conn)) return
    eventsLoadedFor.add(conn)
    const eventsPath = resolve('./events')
    let files = []
    try { files = readdirSync(eventsPath).filter(f => f.endsWith('.js')) } catch { return }
    for (const file of files) {
        try {
            const mod = await import(pathToFileURL(join(eventsPath, file)).href)
            if (!mod.event || !mod.run) continue
            conn.ev.on(mod.event, data => {
                const id = data?.id || data?.key?.remoteJid || null
                if (mod.enabled && id && !mod.enabled(id)) return
                mod.run(conn, data)
            })
        } catch {}
    }
}

export const handler = async (m, conn, plugins) => {
    try {
        if (!m) return

        await loadEvents(conn)
        m = await smsg(conn, m)

        // Botones
        const btn = m.message?.buttonsResponseMessage
            || m.message?.templateButtonReplyMessage
            || m.message?.listResponseMessage
        if (btn) {
            const btnId = (btn.selectedButtonId || btn.singleSelectReply?.selectedRowId || '').trim()
            if (btnId) {
                m.message = { conversation: btnId }
                m.text = btnId
                m.body = btnId
                const sid = m.participant || m.key?.participant || m.key?.remoteJid || ''
                if (m.sender !== sid)
                    Object.defineProperty(m, 'sender', { value: sid, writable: true, configurable: true })
            }
        }

        // Silenciar
        if (m.isGroup) {
            const muted = database.data?.groups?.[m.chat]?.muted || []
            if (muted.includes(m.sender)) {
                await conn.sendMessage(m.chat, { delete: m.key })
                return
            }
        }

        await print(m, conn)
        if (!m.body) return

        // ── PARSEO ────────────────────────────────────────────────────────────
        const cmdMap = buildCmdMap(plugins)
        const parsed = parseMessage(m.body.trim(), cmdMap)
        if (!parsed) return   // no es comando → salir silencioso

        const { commandName, args, usedPrefix, withPrefix } = parsed

        // ── BUSCAR PLUGIN ─────────────────────────────────────────────────────
        let cmd = null

        if (withPrefix && usedPrefix === '$') {
            for (const [, p] of plugins) {
                if (p.customPrefix?.includes('$')) { cmd = p; args.unshift(commandName); break }
            }
        } else {
            cmd = cmdMap.get(commandName) ?? null
        }

        if (!cmd) {
            if (!withPrefix) return  // sin prefijo: ignorar silencioso

            const similares = [...cmdMap.keys()]
                .map(c => ({ c, s: similarity(commandName, c) }))
                .filter(o => o.s >= 40)
                .sort((a, b) => b.s - a.s)
                .slice(0, 3)

            const p   = usedPrefix || '.'
            const sug = similares.length
                ? similares.map(o => `*${p}${o.c}* » ${o.s}%`).join('\n')
                : 'ninguno'

            return conn.sendMessage(m.chat, {
                text: `⸸ *${global.botName}*\n\n*${p}${commandName}* no existe.\nUsa *${p}menu* para ver comandos.\n\n*Similares:*\n${sug}`
            }, { quoted: m })
        }

        // ── PERMISOS ──────────────────────────────────────────────────────────
        const isROwner     = isRootOwnerJid(m.sender)
        const isOwner      = isROwner || isOwnerJid(m.sender)
        const isPremium    = isOwner  || isPremiumJid(m.sender)
        const isRegistered = isOwner  || !!database.data.users?.[m.sender]?.registered
        const isGroup      = m.isGroup
        let isAdmin = false, isBotAdmin = false

        if (isGroup) {
            try {
                const meta   = await conn.groupMetadata(m.chat)
                const clean  = v => (v || '').split('@')[0].split(':')[0]
                const sNum   = clean(m.sender)
                const bNum   = clean(conn.user.id)
                isAdmin    = !!meta.participants.find(p => clean(p.jid || p.id) === sNum)?.admin || isOwner
                isBotAdmin = !!meta.participants.find(p => clean(p.jid || p.id) === bNum)?.admin
            } catch {}
        }

        // ── BD ────────────────────────────────────────────────────────────────
        if (!database.data.users)    database.data.users    = {}
        if (!database.data.groups)   database.data.groups   = {}
        if (!database.data.settings) database.data.settings = {}

        if (!database.data.users[m.sender]) {
            database.data.users[m.sender] = {
                registered: false, premium: false, banned: false,
                warning: 0, exp: 0, level: 1, limit: 20,
                lastclaim: 0, registered_time: 0,
                name: m.pushName || '', age: null
            }
            await database.save()
        }

        if (isGroup && !database.data.groups[m.chat]) {
            database.data.groups[m.chat] = { modoadmin: false, muted: [] }
            await database.save()
        }

        const who = await resolveWho(m, conn, args)

        // ── CHECKS ────────────────────────────────────────────────────────────
        const p = usedPrefix || '.'
        if (isGroup && database.data.groups[m.chat]?.modoadmin && !isAdmin && !isOwner)
            return m.reply(`✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n🔒 *Modo Admin activo.*\n_Solo admins pueden invocar comandos._`)
        if (database.data.users[m.sender]?.banned && !isOwner)
            return m.reply('⸸ ...estás baneado.')
        if (cmd.rowner   && !isROwner)     return m.reply('⸸ ...solo el creador principal.')
        if (cmd.owner    && !isOwner)      return m.reply('⸸ ...solo para mis creadores.')
        if (cmd.premium  && !isPremium)    return m.reply('⸸ ...comando premium.')
        if (cmd.register && !isRegistered) return m.reply(`⸸ ...regístrate.\n📌 *${p}reg nombre.edad*`)
        if (cmd.group    && !isGroup)      return m.reply('⸸ ...solo en grupos.')
        if (cmd.admin    && !isAdmin)      return m.reply('⸸ ...necesitas ser admin.')
        if (cmd.botAdmin && !isBotAdmin)   return m.reply('⸸ ...necesito ser admin del grupo.')
        if (cmd.private  && isGroup)       return m.reply('⸸ ...escríbeme al privado.')
        if (cmd.limit && !isPremium && !isOwner) {
            const lim = database.data.users[m.sender].limit || 0
            if (lim < 1) return m.reply('⸸ ...límites agotados. regresa mañana.')
            database.data.users[m.sender].limit -= 1
            await database.save()
        }

        // ── EJECUTAR ──────────────────────────────────────────────────────────
        try {
            await cmd(m, {
                conn,
                args,
                text:       args.join(' '),
                usedPrefix: p,
                command:    commandName,
                isOwner, isROwner, isPremium, isRegistered,
                isAdmin, isBotAdmin, isGroup,
                who,
                db:      database.data,
                prefix:  p,
                plugins
            })
        } catch (e) {
            const msg   = e?.message || String(e)
            const lines = e?.stack?.split('\n') || []
            let file = '?', line = '?'
            for (const l of lines) {
                const match = l.match(/\((.*plugins.*):(\d+):(\d+)\)/)
                if (match) { file = match[1]; line = match[2]; break }
            }
            const debug = `⸸ *Error*\n📌 ${p}${commandName}\n🧾 ${msg.slice(0, 400)}\n📍 ${file}:${line}`
            console.log(chalk.red(debug))
            if (m?.reply) m.reply(debug)
        }

    } catch (e) {
        if (m?.reply) m.reply(`⸸ *Error global*\n🧾 ${(e?.message || String(e)).slice(0, 400)}`)
    }
}
