import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const settingsPath = resolve(__dirname, '../settings.js')

let handler = async (m, { conn, args }) => {
    let number = args[0]
        ? args[0].replace(/[^0-9]/g, '')
        : m.quoted?.sender?.replace(/[^0-9]/g, '') || null

    if (!number) return m.reply(
        `🕷 *${global.botTag}*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `🕸 Menciona o responde a un usuario\n` +
        `🕷 O escribe su número\n` +
        `🕸 Ejemplo: *${global.prefix}addowner 57xxxxxxxxxx*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `${global.author}`
    )

    const jid = number + '@s.whatsapp.net'

    const yaExiste = global.owner.some(o =>
        (Array.isArray(o) ? o[0] : o).replace(/[^0-9]/g, '') === number
    )

    if (yaExiste) return m.reply(
        `🕷 *${global.botTag}*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `🕸 Ese usuario ya es owner\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `${global.author}`
    )

    // Agregar en memoria
    global.owner.push([number, 'owner', false])

    // Guardar en settings.js para que persista al reiniciar
    try {
        let content = fs.readFileSync(settingsPath, 'utf-8')
        const newEntry = `    ['${number}', 'owner', false],`
        content = content.replace(
            /(global\.owner\s*=\s*\[[\s\S]*?)(])/,
            (match, p1, p2) => `${p1}${newEntry}\n${p2}`
        )
        fs.writeFileSync(settingsPath, content, 'utf-8')
    } catch (e) {
        console.error('[ADDOWNER] No se pudo guardar en settings.js:', e.message)
    }

    await m.react('🕸')
    await conn.sendMessage(m.chat, {
        text:
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 *Nuevo owner agregado*\n\n` +
            `🕷 Usuario: @${number}\n` +
            `🕸 Ahora tiene acceso al sistema\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`,
        mentions: [jid]
    }, { quoted: m })
}

handler.help = ['addowner <número o @user>']
handler.tags = ['owner']
handler.command = ['addowner', 'añadirowner']
handler.owner = true

export default handler
