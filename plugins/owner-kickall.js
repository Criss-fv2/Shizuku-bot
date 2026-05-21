let handler = async (m, { conn }) => {
    try {
        await m.react('🕷')

        const groupMetadata = await conn.groupMetadata(m.chat)
        const participants = groupMetadata.participants
        const botNumber = conn.user.jid

        const nonAdmin = participants.filter(p => !p.admin && p.id !== botNumber)

        if (nonAdmin.length === 0) {
            await m.react('🕸')
            return m.reply(
                `🕷 *${global.botTag}*\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `🕸 No hay miembros que expulsar\n` +
                `🕷 Todos son administradores\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `${global.author}`
            )
        }

        await m.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 Expulsando *${nonAdmin.length}* miembros...\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
        )

        let expulsados = 0
        let fallidos = 0

        for (const p of nonAdmin) {
            try {
                await conn.groupParticipantsUpdate(m.chat, [p.id], 'remove')
                expulsados++
                await new Promise(r => setTimeout(r, 500))
            } catch {
                fallidos++
            }
        }

        await m.react('🕸')
        await m.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 *Kickall completado*\n\n` +
            `🕷 Expulsados: *${expulsados}*\n` +
            `🕸 Fallidos: *${fallidos}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
        )

    } catch (e) {
        await m.react('🕷')
        await m.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 Error al ejecutar kickall\n` +
            `\`${e.message?.slice(0, 200)}\`\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
        )
    }
}

handler.command = ['kickall']
handler.tags = ['owner']
handler.help = ['kickall']
handler.owner = true
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
