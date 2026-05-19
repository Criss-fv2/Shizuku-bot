

import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const execPromise = promisify(exec)

const handler = async (m, { conn, usedPrefix, command }) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!/image|video|webp/.test(mime)) {
        return m.reply(`❌ *FORMATO INVÁLIDO*\n\nResponde a una imagen, video o webp usando *${usedPrefix}${command}*`)
    }

    await m.react('🕷️')

    let tmpDir = path.join('./tmp')
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

    let tmpIn = path.join(tmpDir, `st_in_${Date.now()}`)
    let tmpOut = path.join(tmpDir, `st_out_${Date.now()}.webp`)

    try {
        
        let media
        if (typeof q.download === 'function') {
            media = await q.download()
        } else if (conn.downloadMediaMessage) {
            media = await conn.downloadMediaMessage(q)
        } else if (q.msg && typeof q.msg.download === 'function') {
            media = await q.msg.download()
        } else {
            throw new Error('El núcleo no tiene un método de descarga compatible.')
        }

        if (!media) throw new Error('El archivo descargado está vacío.')

        
        if (/webp/.test(mime)) {
            await conn.sendMessage(m.chat, { sticker: media }, { quoted: m })
            await m.react('🖤')
            return
        }

        fs.writeFileSync(tmpIn, media)

        // Conversión nativa binaria mediante tu entorno FFmpeg
        await execPromise(`ffmpeg -i ${tmpIn} -vcodec libwebp -vf "scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" ${tmpOut}`)

        if (fs.existsSync(tmpOut)) {
            let buffer = fs.readFileSync(tmpOut)
            await conn.sendMessage(m.chat, { sticker: buffer }, { quoted: m })
            await m.react('🖤')
        } else {
            throw new Error('Fallo en el renderizado interno de FFmpeg.')
        }

    } catch (e) {
        console.error(e)
        await m.react('❌')
        return m.reply(`❌ *FALLO DE CONFIGURACIÓN*\n\nNo se pudo procesar el sticker.\n\nDetalle: _${e.message}_\n\n— _Shizuku · Araña Nº8 · revisa tu consola y guarda silencio_ 🕷️`)
    } finally {
        if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn)
        if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut)
    }
}

handler.help = ['s', 'sticker']
handler.tags = ['stickers']
handler.command = ['s', 'sticker', 'stiker']
handler.register = true

export default handler
