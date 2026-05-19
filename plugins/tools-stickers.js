
import { downloadContentFromMessage } from '@whiskeysockets/baileys'
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
        // Extractor Directo de Baileys (Bypassea por completo tu handler.js / simple.js)
        let type = mime.split('/')[0]
        if (type === 'webp') type = 'sticker'
        
        let msg = q.msg || q
        let messageKey = Object.keys(msg).find(key => key.endsWith('Message'))
        let content = messageKey ? msg[messageKey] : msg

        let media
        try {
            let stream = await downloadContentFromMessage(content, type)
            let buffer = Buffer.from([])
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk])
            }
            media = buffer
        } catch (err) {
            // Intento de respaldo secundario directo al objeto plano
            let stream = await downloadContentFromMessage(msg, type)
            let buffer = Buffer.from([])
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk])
            }
            media = buffer
        }

        if (!media || media.length === 0) throw new Error('El archivo descargado no generó bytes.')

        // Si el archivo ya es un sticker, lo reenvía directo para ahorrar RAM en Termux
        if (/webp/.test(mime)) {
            await conn.sendMessage(m.chat, { sticker: media }, { quoted: m })
            await m.react('🖤')
            return
        }

        fs.writeFileSync(tmpIn, media)

        // Renderizado nativo binario mediante tu entorno FFmpeg
        await execPromise(`ffmpeg -i ${tmpIn} -vcodec libwebp -vf "scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" ${tmpOut}`)

        if (fs.existsSync(tmpOut)) {
            let buffer = fs.readFileSync(tmpOut)
            await conn.sendMessage(m.chat, { sticker: buffer }, { quoted: m })
            await m.react('🖤')
        } else {
            throw new Error('FFmpeg no pudo procesar la salida WebP.')
        }

    } catch (e) {
        console.error(e)
        await m.react('❌')
        return m.reply(`❌ *FALLO EXTRAORDINARIO*\n\nError fatal al procesar los binarios.\n\nDetalle: _${e.message}_\n\n— _Shizuku · Araña Nº8 · guarda silencio y limpia tu consola_ 🕷️`)
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
