import { downloadContentFromMessage } from '@whiskeysockets/baileys'

let handler = async (m, { conn }) => {
    if (!m.quoted) 
        return m.reply('*🌷 hey tu! y la imagen estás desafiando a darling~! 😡*')

    try {
        const quoted = m.quoted

        if (!quoted.msg?.viewOnce)
            return m.reply('💔 Ese mensaje no es de una sola vista, darling~')

        let mediaType = quoted.mtype.replace('Message', '')
        let mediaMessage = quoted.msg

        if (!['image', 'video', 'audio'].includes(mediaType))
            return m.reply('💔 Solo puedo usar este comando en mensajes de *ver una sola vez*, darling~')

        await m.react('⏳')

        const stream = await downloadContentFromMessage(mediaMessage, mediaType)

        let buffer = Buffer.alloc(0)
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        if (!buffer.length)
            return m.reply('💔 Error al descargar el archivo, darling~')

        await conn.sendMessage(
            m.chat,
            { [mediaType]: buffer, mimetype: mediaMessage.mimetype },
            { quoted: m }
        )

        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('💔')
        m.reply('💔 No pude recuperar el mensaje, darling... intenta de nuevo~')
    }
}

handler.command = ['ver']
handler.help = ['ver (responde a un mensaje de 1 vista)']
handler.tags = ['herramientas']

export default handler
