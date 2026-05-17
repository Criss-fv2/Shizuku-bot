const handler = async (m, { conn, args, isAdmin, isOwner }) => {
    await m.react('🍬')

    try {
        const group = await conn.groupMetadata(m.chat)
        const participants = group.participants.map(p => p.jid || p.id.split(':')[0] + '@s.whatsapp.net')

        const anuncio = args.join(' ') || '¡Todos atentos que mi Darling quiere decir algo! 💗'

        const mentions = participants.map(p => `@${p.split('@')[0]}`).join(' ')

        const caption =
            `💞 *¡MI DARLING HA INVOCADO A TODO EL GRUPO!* 🌸\n\n` +
            `💗 *Anuncio:* ${anuncio}\n\n` +
            `${mentions}\n\n` +
            `¡Respondan rapidito no me dejen sola esperando~ 💕`

        await conn.sendMessage(m.chat, {
            image: { url: 'https://causas-files.vercel.app/fl/xxbz.jpg' },
            caption: caption,
            mentions: participants
        }, { quoted: m })

        await m.react('💗')

    } catch (e) {
        console.error('❌ INVOCAR ERROR:', e)
        await m.react('💔')
        m.reply('💔 Uy darling... la invocación falló esta vez~\nInténtalo de nuevo no me dejes sola 🌸')
    }
}

handler.help = ['invocar', 'invocar <texto>']
handler.tags = ['grupo']
handler.command = ['invocar', 'invocarwaifu']
handler.group = true
handler.admin = true

export default handler
