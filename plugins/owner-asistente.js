import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

const __dirname   = path.dirname(fileURLToPath(import.meta.url))
const BOT_ROOT    = path.resolve(__dirname, '..')
const PLUGINS_DIR = path.join(BOT_ROOT, 'plugins')
const EVENTS_DIR  = path.join(BOT_ROOT, 'events')

const AI_API = 'https://nexevo.boxmine.xyz/ai/deepseek'
const AI_KEY = 'NEX-Shizuka'

// ─── Utilidades de sistema de archivos ───────────────────────────────────────

function listarPlugins() {
    return fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'))
}

function leerArchivo(ruta) {
    const full = path.join(BOT_ROOT, ruta.replace(/\.\./g, ''))
    if (!fs.existsSync(full)) return null
    return fs.readFileSync(full, 'utf-8')
}

function escribirArchivo(ruta, contenido) {
    const full = path.join(BOT_ROOT, ruta.replace(/\.\./g, ''))
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, contenido, 'utf-8')
}

function borrarArchivo(ruta) {
    const full = path.join(BOT_ROOT, ruta.replace(/\.\./g, ''))
    if (fs.existsSync(full)) { fs.unlinkSync(full); return true }
    return false
}

function buscarEnPlugins(termino) {
    const resultados = []
    for (const file of listarPlugins()) {
        const content = fs.readFileSync(path.join(PLUGINS_DIR, file), 'utf-8')
        const lines   = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(termino.toLowerCase()))
                resultados.push(`${file}:${i + 1} → ${lines[i].trim()}`)
        }
    }
    return resultados
}

// ─── Detectar qué archivos son relevantes para la pregunta ───────────────────

function detectarArchivosRelevantes(query) {
    const q     = query.toLowerCase()
    const todos = listarPlugins()
    const relevantes = []

    for (const file of todos) {
        const nombre = file.replace('.js', '').toLowerCase()
        // Si el query menciona el nombre del archivo o palabras del nombre
        if (q.includes(nombre) || nombre.split(/[-_]/).some(p => p.length > 3 && q.includes(p)))
            relevantes.push(file)
    }

    // Si pregunta sobre "todos" o "todos los comandos" → dar lista sin contenido
    if (q.includes('todos') || q.includes('lista') || q.includes('cuantos'))
        return { modo: 'lista', archivos: todos }

    // Si menciona archivos concretos → leer contenido
    if (relevantes.length > 0 && relevantes.length <= 3)
        return { modo: 'contenido', archivos: relevantes }

    // Por defecto solo lista
    return { modo: 'lista', archivos: todos }
}

// ─── Construir prompt con contexto del bot ────────────────────────────────────

function construirPrompt(query, historial) {
    const plugins   = listarPlugins()
    const { modo, archivos } = detectarArchivosRelevantes(query)

    let contexto = `Eres el sistema de IA integrado del bot de WhatsApp llamado "${global.botName}".
Tienes acceso y control total sobre los archivos del bot.
Prefijo de comandos: ${global.prefix} | Moneda: ${global.moneda}

PLUGINS DISPONIBLES (${plugins.length} total):
${plugins.join(', ')}
`

    if (modo === 'contenido') {
        contexto += `\nCONTENIDO DE ARCHIVOS RELEVANTES:\n`
        for (const file of archivos) {
            const content = leerArchivo(`plugins/${file}`)
            if (content) {
                contexto += `\n--- ${file} ---\n${content.slice(0, 2000)}\n`
            }
        }
    }

    contexto += `
REGLAS IMPORTANTES:
- Si vas a CREAR o MODIFICAR un plugin, responde con el código dentro de bloques:
  [ARCHIVO: plugins/nombre.js]
  \`\`\`javascript
  // código aquí
  \`\`\`
  [/ARCHIVO]
- Si vas a BORRAR un archivo, escribe: [BORRAR: plugins/nombre.js]
- Si solo respondes con texto, no uses esos marcadores.
- Siempre usa el patrón: const handler = async (m, { conn, args, usedPrefix, command, isOwner, isAdmin }) => { ... }
- handler.command, handler.tags, handler.help, export default handler
- Responde siempre en español. Sé directo y conciso.
- No uses emojis de corazón ni estética de Zero Two, usa estética de araña (🕷️ 🕸️ ⸸ ✠).
`

    // Agregar historial de conversación
    let mensajes = contexto + '\n'
    for (const h of historial.slice(-6)) {
        mensajes += h.role === 'user'
            ? `\nUSUARIO: ${h.content}`
            : `\nBOT: ${h.content}`
    }
    mensajes += `\nUSUARIO: ${query}\nBOT:`

    return mensajes
}

// ─── Parsear respuesta: detectar acciones de archivo ─────────────────────────

function parsearRespuesta(respuesta) {
    const acciones = []
    const texto    = respuesta

    // Detectar bloques [ARCHIVO: ruta] ... [/ARCHIVO]
    const archivoRegex = /\[ARCHIVO:\s*([^\]]+)\]\s*```(?:javascript|js)?\n([\s\S]*?)```\s*\[\/ARCHIVO\]/g
    let match
    while ((match = archivoRegex.exec(texto)) !== null) {
        acciones.push({ tipo: 'escribir', ruta: match[1].trim(), contenido: match[2] })
    }

    // Detectar [BORRAR: ruta]
    const borrarRegex = /\[BORRAR:\s*([^\]]+)\]/g
    while ((match = borrarRegex.exec(texto)) !== null) {
        acciones.push({ tipo: 'borrar', ruta: match[1].trim() })
    }

    // Limpiar marcadores del texto final
    const textoLimpio = texto
        .replace(/\[ARCHIVO:[^\]]+\]\s*```(?:javascript|js)?\n[\s\S]*?```\s*\[\/ARCHIVO\]/g, '')
        .replace(/\[BORRAR:[^\]]+\]/g, '')
        .trim()

    return { textoLimpio, acciones }
}

// ─── Ejecutar acciones detectadas en la respuesta ────────────────────────────

function ejecutarAcciones(acciones) {
    const log = []
    for (const accion of acciones) {
        if (accion.tipo === 'escribir') {
            escribirArchivo(accion.ruta, accion.contenido)
            log.push(`✅ Guardado: ${accion.ruta}`)
        }
        if (accion.tipo === 'borrar') {
            const ok = borrarArchivo(accion.ruta)
            log.push(ok ? `🗑️ Eliminado: ${accion.ruta}` : `❌ No encontrado: ${accion.ruta}`)
        }
    }
    return log
}

// ─── Sesiones por usuario ────────────────────────────────────────────────────

const sesiones = new Map()

function getSesion(jid) {
    if (!sesiones.has(jid)) sesiones.set(jid, [])
    return sesiones.get(jid)
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

const handler = async (m, { conn, args, isOwner, usedPrefix, command }) => {
    if (!isOwner)
        return m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝖌𝖊𝖓𝖙𝖊 〕══ ✠\n\n` +
            `⸸ Solo mis creadores pueden hablar conmigo directamente. 🕷️`
        )

    const subCmd = args[0]?.toLowerCase()

    if (subCmd === 'reset' || subCmd === 'limpiar') {
        sesiones.delete(m.sender)
        return m.reply(`✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝖌𝖊𝖓𝖙𝖊 〕══ ✠\n\n🕸️ Memoria limpiada. 🕷️`)
    }

    const query = args.join(' ').trim()
    if (!query)
        return m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝖌𝖊𝖓𝖙𝖊 〕══ ✠\n\n` +
            `⸸ Dime qué necesitas.\n\n` +
            `Ejemplos:\n` +
            `› *${usedPrefix}${command} ¿todos los plugins están bien?*\n` +
            `› *${usedPrefix}${command} crea un comando .dado*\n` +
            `› *${usedPrefix}${command} borra el plugin descargas-play.js*\n` +
            `› *${usedPrefix}${command} busca si algún plugin tiene darling*\n` +
            `› *${usedPrefix}${command} reset* — limpiar memoria\n\n` +
            `_...tengo acceso a todos mis archivos._ 🕷️`
        )

    const historial = getSesion(m.sender)

    const aviso = await conn.sendMessage(m.chat, {
        text: `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝖌𝖊𝖓𝖙𝖊 〕══ ✠\n\n⏳ Procesando...\n_...revisando mis archivos._ 🕷️`
    }, { quoted: m })

    try {
        const prompt   = construirPrompt(query, historial)
        const response = await axios.get(AI_API, {
            params: { text: prompt, apikey: AI_KEY },
            timeout: 30000
        })

        const rawResp = response.data?.result || response.data?.response || response.data?.message || ''
        if (!rawResp) throw new Error('La IA no devolvió respuesta.')

        const { textoLimpio, acciones } = parsearRespuesta(rawResp)
        const logs = ejecutarAcciones(acciones)

        // Guardar en historial
        historial.push({ role: 'user', content: query })
        historial.push({ role: 'assistant', content: textoLimpio })
        if (historial.length > 20) historial.splice(0, 2)

        let final = `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝖌𝖊𝖓𝖙𝖊 〕══ ✠\n\n${textoLimpio}`
        if (logs.length) final += `\n\n${logs.join('\n')}`
        final += `\n\n_${global.dev}_ 🕷️`

        await conn.sendMessage(m.chat, { text: final, edit: aviso.key })

    } catch (e) {
        console.error('[BOT AGENT ERROR]', e.message)
        await conn.sendMessage(m.chat, {
            text:
                `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝖌𝖊𝖓𝖙𝖊 〕══ ✠\n\n` +
                `⸸ Error en el agente.\n\`${e.message.slice(0, 300)}\`\n\n` +
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
