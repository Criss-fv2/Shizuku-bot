import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

const __dirname   = path.dirname(fileURLToPath(import.meta.url))
const BOT_ROOT    = path.resolve(__dirname, '..')
const PLUGINS_DIR = path.join(BOT_ROOT, 'plugins')

// ─── APIs de IA disponibles (se prueba en orden hasta que una responda) ───────
const IA_APIS = [
    {
        nombre: 'Alyacore',
        llamar: async (prompt) => {
            const res = await axios.get('https://api.alyacore.xyz/ai/copilot', {
                params: { text: prompt, key: global.apiConfigs?.alyacore?.key || 'Shizuku-bot' },
                timeout: 25000
            })
            const d = res.data
            if (!d?.status) throw new Error(d?.message || 'Sin respuesta')
            return d.result || d.response || d.message || d.data
        }
    },
    {
        nombre: 'Stellar',
        llamar: async (prompt) => {
            const res = await axios.get('https://api.stellarwa.xyz/api/ai/gpt', {
                params: { text: prompt, apikey: global.apiConfigs?.stellar?.key || 'YukiWaBot' },
                timeout: 25000
            })
            const d = res.data
            if (!d?.status) throw new Error(d?.message || 'Sin respuesta')
            return d.result || d.response || d.message
        }
    },
    {
        nombre: 'Siputzx',
        llamar: async (prompt) => {
            const res = await axios.get('https://api.siputzx.my.id/api/ai/llama3', {
                params: { prompt },
                timeout: 25000
            })
            const d = res.data
            if (!d?.status) throw new Error('Sin respuesta')
            return d.data || d.result
        }
    }
]

async function llamarIA(prompt) {
    let ultimo = null
    for (const api of IA_APIS) {
        try {
            const resultado = await api.llamar(prompt)
            if (resultado && typeof resultado === 'string' && resultado.trim())
                return { respuesta: resultado.trim(), api: api.nombre }
        } catch (e) {
            ultimo = e.message
            continue
        }
    }
    throw new Error(`Todas las APIs fallaron. Último error: ${ultimo}`)
}

// ─── Sistema de archivos ──────────────────────────────────────────────────────

function listarPlugins() {
    return fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'))
}

function leerArchivo(ruta) {
    const full = path.join(BOT_ROOT, ruta.replace(/\.\./g, ''))
    if (!fs.existsSync(full)) return null
    const content = fs.readFileSync(full, 'utf-8')
    return content.length > 3000 ? content.slice(0, 3000) + '\n...[truncado]' : content
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

function buscarEnPlugins(termino) {
    const resultados = []
    for (const file of listarPlugins()) {
        const lines = fs.readFileSync(path.join(PLUGINS_DIR, file), 'utf-8').split('\n')
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(termino.toLowerCase()))
                resultados.push(`${file}:${i + 1} → ${lines[i].trim()}`)
        }
    }
    return resultados
}

// ─── Detectar archivos relevantes para la pregunta ───────────────────────────

function getContextoRelevante(query) {
    const q       = query.toLowerCase()
    const plugins = listarPlugins()
    let contexto  = `Plugins disponibles (${plugins.length}): ${plugins.join(', ')}\n`

    const relevantes = plugins.filter(file => {
        const nombre = file.replace('.js', '').toLowerCase()
        return q.includes(nombre) || nombre.split(/[-_]/).some(p => p.length > 3 && q.includes(p))
    })

    if (relevantes.length > 0 && relevantes.length <= 3) {
        for (const file of relevantes) {
            const content = leerArchivo(`plugins/${file}`)
            if (content) contexto += `\n--- ${file} ---\n${content}\n`
        }
    }

    return contexto
}

// ─── Parsear acciones de la respuesta ────────────────────────────────────────

function parsearAcciones(respuesta) {
    const acciones = []

    const archivoRegex = /\[ARCHIVO:\s*([^\]]+)\]\s*```(?:javascript|js)?\n([\s\S]*?)```\s*\[\/ARCHIVO\]/g
    let match
    while ((match = archivoRegex.exec(respuesta)) !== null)
        acciones.push({ tipo: 'escribir', ruta: match[1].trim(), contenido: match[2] })

    const borrarRegex = /\[BORRAR:\s*([^\]]+)\]/g
    while ((match = borrarRegex.exec(respuesta)) !== null)
        acciones.push({ tipo: 'borrar', ruta: match[1].trim() })

    const textoLimpio = respuesta
        .replace(/\[ARCHIVO:[^\]]+\]\s*```(?:javascript|js)?\n[\s\S]*?```\s*\[\/ARCHIVO\]/g, '')
        .replace(/\[BORRAR:[^\]]+\]/g, '')
        .trim()

    return { textoLimpio, acciones }
}

function ejecutarAcciones(acciones) {
    return acciones.map(a => {
        if (a.tipo === 'escribir') {
            escribirArchivo(a.ruta, a.contenido)
            return `✅ Guardado: ${a.ruta}`
        }
        if (a.tipo === 'borrar') {
            return borrarArchivo(a.ruta) ? `🗑️ Eliminado: ${a.ruta}` : `❌ No encontrado: ${a.ruta}`
        }
    })
}

// ─── Sesiones ─────────────────────────────────────────────────────────────────

const sesiones = new Map()

function buildPrompt(query, jid) {
    const hist    = sesiones.get(jid) || []
    const ctx     = getContextoRelevante(query)

    let prompt =
        `Eres el agente IA del bot de WhatsApp "${global.botName}". ` +
        `Tienes acceso total a los archivos del bot. ` +
        `Prefijo: ${global.prefix} | Moneda: ${global.moneda}\n\n` +
        `CONTEXTO DEL BOT:\n${ctx}\n` +
        `INSTRUCCIONES:\n` +
        `- Para crear/modificar un archivo responde con: [ARCHIVO: plugins/nombre.js]\n\`\`\`javascript\n...código...\n\`\`\`\n[/ARCHIVO]\n` +
        `- Para borrar: [BORRAR: plugins/nombre.js]\n` +
        `- Siempre usa export default handler y handler.command, handler.tags, handler.help\n` +
        `- Responde en español, sé directo\n` +
        `- Estética de araña (🕷️ ⸸ ✠), NO usar emojis de corazón ni "darling"\n\n`

    for (const h of hist.slice(-6))
        prompt += h.role === 'user' ? `Usuario: ${h.content}\n` : `Agente: ${h.content}\n`

    prompt += `Usuario: ${query}\nAgente:`
    return prompt
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
            `› *${usedPrefix}${command} borra el plugin descargas-play.js*\n` +
            `› *${usedPrefix}${command} busca la palabra darling en mis plugins*\n` +
            `› *${usedPrefix}${command} reset* — limpiar memoria\n\n` +
            `_...tengo acceso a todos mis archivos._ 🕷️`
        )

    const aviso = await conn.sendMessage(m.chat, {
        text: `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝖌𝖊𝖓𝖙𝖊 〕══ ✠\n\n⏳ Pensando...\n_...consultando mis archivos._ 🕷️`
    }, { quoted: m })

    try {
        const prompt             = buildPrompt(query, m.sender)
        const { respuesta, api } = await llamarIA(prompt)
        const { textoLimpio, acciones } = parsearAcciones(respuesta)
        const logs = ejecutarAcciones(acciones)

        const hist = sesiones.get(m.sender) || []
        hist.push({ role: 'user', content: query })
        hist.push({ role: 'assistant', content: textoLimpio })
        if (hist.length > 20) hist.splice(0, 2)
        sesiones.set(m.sender, hist)

        let final = `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝖌𝖊𝖓𝖙𝖊 〕══ ✠\n\n${textoLimpio}`
        if (logs.length) final += `\n\n${logs.join('\n')}`
        final += `\n\n_vía ${api} · ${global.dev}_ 🕷️`

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
