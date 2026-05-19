

import { Sticker, StickerTypes } from 'wa-sticker-formatter'

const handler = async (m, { conn, usedPrefix, command }) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!/image|video|webp/.test(mime)) {
        return m.reply(`❌ *FORMATO INVÁLIDO*\n\nResponde a una imagen, video o gif usando *${usedPrefix}${command}*`)
    }

    await m.react('🕷️')

    try {
        let media = await q.download()
        let packname = global.packname || 'Shizuku Bot'
        let author = global.author || 'Araña Nº8'

        let configSticker = new Sticker(media, {
            pack: packname,
            author: author,
            type: StickerTypes.FULL,
            quality: 70
        })

        let buffer = await configSticker.toBuffer()
        await conn.sendMessage(m.chat, { sticker: buffer }, { quoted: m })
        await m.react('🖤')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        return m.reply(`❌ *FALLO DE SISTEMA*\n\nError en la conversión binaria. Verifica los códecs de tu terminal.\n\n— _Shizuku · Araña Nº8 · guarda silencio y quédate con tu duda_ 🕷️`)
    }
}

handler.help = ['s', 'sticker']
handler.tags = ['stickers']
handler.command = ['s', 'sticker', 'stiker']
handler.register = true

export default handler
