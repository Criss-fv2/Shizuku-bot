import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

const __dirname   = path.dirname(fileURLToPath(import.meta.url))
const BOT_ROOT    = path.resolve(__dirname, '..')
const PLUGINS_DIR = path.join(BOT_ROOT, 'plugins')

// ─── PON TU API KEY DE GEMINI AQUÍ ─────────────────────────────────────────────
// Consíguela gratis en: https://aistudio.google.com/apikey
const GEMINI_KEY = global.apiConfigs?.gemini?.key || 'AQ.Ab8RN6KFwHQTdm6NsOSU1QVzd5uwJYw5IQqERVDUEh5uXpLjGg'

async function llamarIA(systemPrompt, historial, query) {
    if (GEMINI_KEY === 'AQ.Ab8RN6KFwHQTdm6NsOSU1QVzd5uwJYw5IQqERVDUEh5uXpLjGg')
        throw new Error('No has configurado tu API key de Gemini. Consíguela gratis en aistudio.google.com/apikey')

    const contents = []
    for (const h of historial.slice(-6)) {
        contents.push({
            role:  h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
        })
    }
    contents.push({ role: 'user', parts: [{ text: query }] })

    const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        },
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        }
    )

    const texto = res.data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!texto) {
        const bloqueo = res.data?.candidates?.[0]?.finishReason
        throw new Error(bloqueo ? `Gemini bloqueó la respuesta: ${bloqueo}` : 'Gemini no devolvió respuesta')
    }
    return texto.trim()
}

// ─── Sistema de archivos ──────────────────────────────────────────────────────

function listarPlugins() {
    return fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'))
}

function leerArchivo(ruta) {
    const full = path.join(BOT_ROOT, ruta.replace(/\.\./g, ''))
    if (!fs.existsSync(full)) return null
    const c = fs.readFileSync(full, 'utf-8')
    return c.length > 4000 ? c.slice(0, 4000) + '\n...[truncado]' : c
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

function getSystemPrompt(query) {
    const ctx = getContexto(query)
    return (
        `Eres el agente IA del bot de WhatsApp "${global.botName}". ` +
        `Tienes acceso total a sus archivos. Prefijo: ${global.prefix}. Moneda: ${global.moneda}. ` +
        `Responde siempre en español. Sé directo y conciso. ` +
        `Usa estética de araña (🕷️ ⸸ ✠), nunca "darling" ni emojis de corazón rosado. ` +
        `Para crear/modificar un archivo usa EXACTAMENTE este formato:\n` +
        `[ARCHIVO: plugins/nombre.js]\n\`\`\`javascript\n...código completo...\n\`\`\`\n[/ARCHIVO]\n` +
        `Para borrar un archivo: [BORRAR: plugins/nombre.js]\n` +
        `Todo plugin debe tener: const handler = async (m, { conn, args, usedPrefix, command, isOwner, isAdmin, isGroup }) => {...}, ` +
        `handler.command, handler.tags, handler.help, export default handler.\n\n` +
        `CONTEXTO DEL BOT:\n${ctx}`
    )
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
        const hist   = sesiones.get(m.sender) || []
        const system = getSystemPrompt(query)
        const raw    = await llamarIA(system, hist, query)

        const { texto, acciones } = parsear(raw)
        const logs = ejecutar(acciones)

        hist.push({ role: 'user', content: query })
        hist.push({ role: 'model', content: texto })
        if (hist.length > 20) hist.splice(0, 2)
        sesiones.set(m.sender, hist)

        let final = `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝖌𝖊𝖓𝖙𝖊 〕══ ✠\n\n${texto}`
        if (logs.length) final += `\n\n${logs.join('\n')}`
        final += `\n\n_${global.dev}_ 🕷️`

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
