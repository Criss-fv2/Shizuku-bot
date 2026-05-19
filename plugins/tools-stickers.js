

import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const execPromise = promisify(exec)

const handler = async (m, { conn, usedPrefix, command }) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!/image|video|webp/.test(mime)) {
        return m.reply(`❌ *FORMATO INVÁLIDO*\n\nResponde a una imagen o video usando *${usedPrefix}${command}*`)
    }

    await m.react('🕷️')

    let tmpDir = path.join('./tmp')
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

    let tmpIn = path.join(tmpDir, `st_in_${Date.now()}`)
    let tmpOut = path.join(tmpDir, `st_out_${Date.now()}.webp`)

    try {
        let media = await q.download()
        fs.writeFileSync(tmpIn, media)

        await execPromise(`ffmpeg -i ${tmpIn} -vcodec libwebp -vf "scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" ${tmpOut}`)

        if (fs.existsSync(tmpOut)) {
            let buffer = fs.readFileSync(tmpOut)
            await conn.sendMessage(m.chat, { sticker: buffer }, { quoted: m })
            await m.react('🖤')
        } else {
            throw new Error('Fallo en renderizado FFmpeg')
        }

    } catch (e) {
        console.error(e)
        await m.react('❌')
        return m.reply(`❌ *FALLO DE ENTORNO*\n\nError crítico de conversión. Asegúrate de tener FFmpeg activo en tu Termux.\n\n— _Shizuku · Araña Nº8 · si tu terminal es incompetente, no es mi problema_ 🕷️`)
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
