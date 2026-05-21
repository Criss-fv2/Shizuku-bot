const handler = async (m, { conn }) => {
    await m.react('🕷')

    const context = m.message?.extendedTextMessage?.contextInfo
    const objetivo = context?.participant || m.sender

    const esLID = objetivo.endsWith('@lid')
    const tipo = esLID ? 'LID oculto (@lid)' : 'Número visible (@s.whatsapp.net)'
    const numero = objetivo.replace(/\D/g, '')

    await m.reply(
        `🕷 *${global.botTag}*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `🕸 *Información del usuario*\n\n` +
        `🕷 Identificador: *${objetivo}*\n` +
        `🕸 Número: *+${numero}*\n` +
        `🕷 Tipo: *${tipo}*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `${global.author}`
    )

    await m.react('🕸')
}

handler.help = ['lid']
handler.tags = ['owner']
handler.command = ['lid', 'mylid', 'tulid']
handler.owner = true
handler.group = true

export default handler
