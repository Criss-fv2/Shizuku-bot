import { database } from '../lib/database.js'

const handler = async (m, { args, prefix, command, isOwner, isAdmin }) => {

    if (!database.data.groups) database.data.groups = {}
    if (!database.data.groups[m.chat]) database.data.groups[m.chat] = {}

    const chat = database.data.groups[m.chat]
    const action = args[0]?.toLowerCase()

    // Sin argumentos → mostrar estado actual
    if (!action) {
        const estado = chat.bot === false ? '🔴 Apagado' : '🟢 Encendido'
        return m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n` +
            `🕷️ *Estado del bot:* ${estado}\n\n` +
            `› *${prefix}bot on* — activar\n` +
            `› *${prefix}bot off* — desactivar\n\n` +
            `_Solo admins pueden controlarlo._ 🕸️`
        )
    }

    if (action !== 'on' && action !== 'off') {
        return m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n` +
            `⸸ Uso incorrecto.\n` +
            `› *${prefix}bot on*\n` +
            `› *${prefix}bot off*`
        )
    }

    const encender = action === 'on'

    // Ya está en ese estado
    if (encender && chat.bot !== false) {
        return m.reply(`🕷️ El bot ya estaba encendido en este grupo.`)
    }
    if (!encender && chat.bot === false) {
        return m.reply(`🕷️ El bot ya estaba apagado en este grupo.`)
    }

    // Cambiar estado y guardar
    chat.bot = encender
    await database.save()

    if (encender) {
        await m.react('🕷️')
        return m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n` +
            `🟢 *Bot activado.*\n` +
            `_...de acuerdo, atenderé este grupo._ 🕷️`
        )
    } else {
        await m.react('🕸️')
        return m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n` +
            `🔴 *Bot desactivado.*\n` +
            `_...no estaré disponible aquí hasta nuevo aviso._ 🕸️`
        )
    }
}

handler.help    = ['bot on', 'bot off']
handler.tags    = ['grupo']
handler.command = ['bot']
handler.group   = true
handler.admin   = true

export default handler
