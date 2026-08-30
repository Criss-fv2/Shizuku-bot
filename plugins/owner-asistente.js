import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

const __dirname   = path.dirname(fileURLToPath(import.meta.url))
const BOT_ROOT    = path.resolve(__dirname, '..')
const PLUGINS_DIR = path.join(BOT_ROOT, 'plugins')

// ─── APIs en cascada — se prueba cada una hasta que responda ─────────────────
const APIS = [
    // 1. DuckDuckGo AI (sin key, sin registro, usa GPT-4o Mini)
    async (prompt) => {
        const token = await axios.get('https://duckduckgo.com/duckchat/v1/status', {
            headers: { 'x-vqd-accept': '1' },
            timeout: 10000
        })
        const vqd = token.headers['x-vqd-4']
        if (!vqd) throw new Error('No se obtuvo token de DuckDuckGo')

        const res = await axios.post(
            'https://duckduckgo.com/duckchat/v1/chat',
            {
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-vqd-4': vqd,
                    'User-Agent': 'Mozilla/5.0'
                },
                timeout: 30000,
                responseType: 'text'
            }
        )

        // DuckDuckGo responde en SSE (data: {...}\n)
        const lines = res.data.split('\n').filter(l => l.startsWith('data: ') && !l.includes('[DONE]'))
        const texto = lines.map(l => {
            try { return JSON.parse(l.slice(6))?.message || '' } catch { return '' }
        }).join('')

        if (!texto.trim()) throw new Error('DuckDuckGo sin respuesta')
        return texto.trim()
    },

    // 2. Blackbox AI (sin key)
    async (prompt) => {
        const res = await axios.post(
            'https://www.blackbox.ai/api/chat',
            {
                messages: [{ id: '1', content: prompt, role: 'user' }],
                id: '1',
                previewToken: null,
                userId: null,
                codeModelMode: false,
                agentMode: {},
                trendingAgentMode: {},
                isMicMode: false,
                isChromeExt: false,
                githubToken: null
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': 'https://www.blackbox.ai'
                },
                timeout: 30000
            }
        )
        const text = typeof res.data === 'string' ? res.data : res.data?.response
        if (!text?.trim()) throw new Error('Blackbox sin respuesta')
        // Limpiar tags internos de Blackbox
        return text.replace(/\$@\$.*?\$@\$/gs, '').trim()
    },

    // 3. Liaobots (sin key, múltiples modelos)
    async (prompt) => {
        const auth = await axios.post(
            'https://liaobots.work/recaptcha/api/login',
            { token: 'null' },
            { headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://liaobots.work' }, timeout: 10000 }
        )
        const authCode = auth.data?.authCode
        if (!authCode) throw new Error('Liaobots sin authCode')

        const res = await axios.post(
            'https://liaobots.work/api/chat',
            {
                conversationId: Math.random().toString(36).slice(2),
                model: { id: 'gpt-4o-mini-2024-07-18', name: 'GPT-4o Mini', maxLength: 31200, tokenLimit: 7800 },
                messages: [{ role: 'user', content: prompt }],
                key: '',
                prompt: 'You are a helpful assistant.'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': 'https://liaobots.work',
                    'x-auth-code': authCode
                },
                timeout: 30000,
                responseType: 'text'
            }
        )
        const text = res.data
        if (!text?.trim()) throw new Error('Liaobots sin respuesta')
        return text.trim()
    }
]

async function llamarIA(prompt) {
    const errores = []
    for (let i = 0; i < APIS.length; i++) {
        try {
            const resultado = await APIS[i](prompt)
            if (resultado && resultado.trim()) return { texto: resultado.trim(), fuente: ['DuckDuckGo','Blackbox','Liaobots'][i] }
        } catch (e) {
            errores.push(`API${i + 1}: ${e.message}`)
        }
    }
    throw new Error(errores.join(' | '))
}

// ─── Sistema de archivos ──────────────────────────────────────────────────────

function listarPlugins() {
    return fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'))
}

function leerArchivo(ruta) {
    const full = path.join(BOT_ROOT, ruta.replace(/\.\./g, ''))
    if (!fs.existsSync(full)) return null
    const c = fs.readFileSync(full, 'utf-8')
    return c.length > 3000 ? c.slice(0, 3000) + '\n...[truncado]' : c
}

function escribirArchivo(ruta, contenido) {
    const full = path.join(BOT_ROOT, ruta.replace(/\.\./g, ''))
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, contenido, 'utf-8')
}

function borrarArchivo(ruta) {
    const full = path.join(BOT_ROOT, ruta.replace(/\.\./g, ''))
    if (!fs.existsSync(full)) return false
    fs.unlinkSync(full)
    return true
}

function getContexto(query) {
    const q       = query.toLowerCase()
    const plugins = listarPlugins()
    let ctx       = `Plugins (${plugins.length} total): ${plugins.join(', ')}\n`

    const relevantes = plugins.filter(f => {
        const n = f.replace('.js', '').toLowerCase()
        return q.includes(n) || n.split(/[-_]/).some(p => p.length > 3 && q.includes(p))
    })

    if (relevantes.length > 0 && relevantes.length <= 3) {
        for (const f of relevantes) {
            const c = leerArchivo(`plugins/${f}`)
            if (c) ctx += `\n--- ${f} ---\n${c}\n`
        }
    }
    return ctx
}

function parsear(respuesta) {
    const acciones = []
    const rA = /\[ARCHIVO:\s*([^\]]+)\]\s*```(?:javascript|js)?\n([\s\S]*?)```\s*\[\/ARCHIVO\]/g
    const rB = /\[BORRAR:\s*([^\]]+)\]/g
    let m
    while ((m = rA.exec(respuesta)) !== null)
        acciones.push({ tipo: 'escribir', ruta: m[1].trim(), contenido: m[2] })
    while ((m = rB.exec(respuesta)) !== null)
        acciones.push({ tipo: 'borrar', ruta: m[1].trim() })

    const texto = respuesta
        .replace(/\[ARCHIVO:[^\]]+\]\s*```(?:javascript|js)?\n[\s\S]*?```\s*\[\/ARCHIVO\]/g, '')
        .replace(/\[BORRAR:[^\]]+\]/g, '')
        .trim()
    return { texto, acciones }
}

function ejecutar(acciones) {
    return acciones.map(a => {
        if (a.tipo === 'escribir') { escribirArchivo(a.ruta, a.contenido); return `✅ Guardado: ${a.ruta}` }
        if (a.tipo === 'borrar')   { return borrarArchivo(a.ruta) ? `🗑️ Eliminado: ${a.ruta}` : `❌ No existe: ${a.ruta}` }
    }).filter(Boolean)
}

const sesiones = new Map()

function buildPrompt(query, jid) {
    const hist   = sesiones.get(jid) || []
    const ctx    = getContexto(query)
    const system =
        `Eres el agente IA del bot de WhatsApp "${global.botName}". ` +
        `Tienes acceso total a sus archivos. Prefijo: ${global.prefix}. Moneda: ${global.moneda}. ` +
        `Responde siempre en español. Sé directo y conciso. ` +
        `Usa estética de araña (🕷️ ⸸ ✠). ` +
        `Para crear/modificar un archivo usa: [ARCHIVO: plugins/nombre.js]\n\`\`\`javascript\n...código\n\`\`\`\n[/ARCHIVO]. ` +
        `Para borrar: [BORRAR: plugins/nombre.js]. ` +
        `Siempre incluye handler.command, handler.tags, handler.help, export default handler.\n\n` +
        `CONTEXTO DEL BOT:\n${ctx}\n`

    let histStr = ''
    for (const h of hist.slice(-6))
        histStr += h.role === 'user' ? `\nUsuario: ${h.content}` : `\nAgente: ${h.content}`

    return `${system}${histStr}\nUsuario: ${query}\nAgente:`
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

const handler = async (m, { conn, args, isOwner, usedPrefix, command }) => {
    if (!isOwner)
        return m.reply(`✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝖌𝖊𝖓𝖙𝖊 〕══ ✠\n\n⸸ Solo mis creadores. 🕷️`)

    if (args[0]?.toLowerCase() === 'reset') {
        sesiones.delete(m.sender)
        return m.reply(`✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝖌𝖊𝖓𝖙𝖊 〕══ ✠\n\n🕸️ Memoria limpiada. 🕷️`)
    }

    const query = args.join(' ').trim()
    if (!query)
        return m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝖌𝖊𝖓𝖙𝖊 〕══ ✠\n\n` +
            `⸸ Dime qué necesitas.\n\n` +
            `› *${usedPrefix}${command} ¿todos los plugins están bien?*\n` +
            `› *${usedPrefix}${command} crea un comando .dado*\n` +
            `› *${usedPrefix}${command} borra descargas-play.js*\n` +
            `› *${usedPrefix}${command} busca la palabra darling*\n` +
            `› *${usedPrefix}${command} reset* — limpiar memoria\n\n` +
            `_...tengo acceso a todos mis archivos._ 🕷️`
        )

    const aviso = await conn.sendMessage(m.chat, {
        text: `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝖌𝖊𝖓𝖙𝖊 〕══ ✠\n\n⏳ Pensando...\n_...analizando archivos._ 🕷️`
    }, { quoted: m })

    try {
        const prompt = buildPrompt(query, m.sender)
        const { texto: raw, fuente } = await llamarIA(prompt)
        const { texto, acciones } = parsear(raw)
        const logs = ejecutar(acciones)

        const hist = sesiones.get(m.sender) || []
        hist.push({ role: 'user', content: query })
        hist.push({ role: 'assistant', content: texto })
        if (hist.length > 20) hist.splice(0, 2)
        sesiones.set(m.sender, hist)

        let final = `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝖌𝖊𝖓𝖙𝖊 〕══ ✠\n\n${texto}`
        if (logs.length) final += `\n\n${logs.join('\n')}`
        final += `\n\n_vía ${fuente} · ${global.dev}_ 🕷️`

        await conn.sendMessage(m.chat, { text: final, edit: aviso.key })

    } catch (e) {
        console.error('[AGENTE ERROR]', e.message)
        await conn.sendMessage(m.chat, {
            text:
                `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝖌𝖊𝖓𝖙𝖊 〕══ ✠\n\n` +
                `⸸ Error: \`${e.message.slice(0, 300)}\`\n\n` +
                `_...intenta de nuevo._ 🕷️`,
            edit: aviso.key
        })
    }
}

handler.help    = ['bot <pregunta o instrucción>']
handler.tags    = ['owner']
handler.command = ['bot', 'agente', 'cerebro']
handler.owner   = true

export default handler
