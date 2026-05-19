import { sticker } from '../lib/sticker.js'

const handler = async (m, { conn, usedPrefix, command }) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!/image|video|webp/.test(mime)) {
        return m.reply(`❌ *FORMATO INVÁLIDO*\n\nResponde a una imagen, video o gif usando *${usedPrefix}${command}* para procesarlo.`)
    }

    await m.react('🕷️')

    try {
        let media = await q.download()
        let packname = global.packname || '${global.author}`) '
        let author = global.author || 'Araña Nº8'
        
        let stiker = await sticker(media, false, packname, author)
        
        if (stiker) {
            await conn.sendFile(m.chat, stiker, 'sticker.webp', '', m)
            await m.react('🖤')
        } else {
            throw new Error('Conversión primaria fallida')
        }
    } catch (e) {
        console.error(e)
        try {
            let media = await q.download()
            let packname = global.packname || 'Shizuku Bot'
            let author = global.author || 'Araña Nº8'
            
            await conn.sendImageAsSticker(m.chat, media, m, { packname, author })
            await m.react('🖤')
        } catch (err) {
            await m.react('❌')
            return m.reply(`❌ *FALLO DE SISTEMA*\n\nNo se pudo procesar el archivo.\n\n— _Shizuku · Araña Nº8 · guarda silencio y quédate con tu sticker_ 🕷️`)
        }
    }
}

handler.help = ['s', 'sticker']
handler.tags = ['stickers']
handler.command = ['s', 'sticker', 'stiker']
handler.register = true

export default handler
