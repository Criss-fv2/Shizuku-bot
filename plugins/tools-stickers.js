

import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const execPromise = promisify(exec)

const handler = async (m, { conn, usedPrefix, command }) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''

    // Validación estricta de formato (Imágenes, Videos, GIFs)
    if (!/image|video|webp/.test(mime)) {
        await m.react('🕷️')
        return m.reply(`🕷️ ¿Y el archivo multimedia?\n\nResponde a una imagen, gif o video usando:\n*${usedPrefix}${command}*`)
    }

  
    let isVideo = /video/.test(mime)
    let duration = (q.msg || q).seconds || (q.msg || q).duration || 0
    if (isVideo && duration > 15) {
        await m.react('❌')
        return m.reply(`❌ *SISTEMA CONGELADO PREVENIDO*\n\nEl video o gif que enviaste dura ${duration} segundos. El límite permitido es de *15 segundos*.\n\n— _Shizuku · Araña Nº8_ 🕷️`)
    }

    await m.react('🕷️')

    let tmpDir = path.join('./tmp')
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

    let tmpIn = path.join(tmpDir, `st_in_${Date.now()}`)
    let tmpOut = path.join(tmpDir, `st_out_${Date.now()}.webp`)

    try {
        
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
        } catch {
            let stream = await downloadContentFromMessage(msg, type)
            let buffer = Buffer.from([])
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk])
            }
            media = buffer
        }

        if (!media || media.length === 0) throw new Error('Los binarios multimedia están vacíos.')

        
        let packname = global.packname || 'Shizuku System 🕷️'
        let author = global.author || 'Shizuku-Bot'

        
        if (typeof conn.sendImageAsSticker === 'function') {
            try {
                await conn.sendImageAsSticker(m.chat, media, m, { 
                    packname: packname, 
                    author: author 
                })
                await m.react('🖤')
                return
            } catch (errSticker) {
                console.log('Metodo sendImageAsSticker no disponible o sin soporte Exif, usando fallback...')
            }
        }

        
        if (/webp/.test(mime)) {
            await conn.sendMessage(m.chat, { sticker: media }, { quoted: m })
            await m.react('🖤')
            return
        }

        fs.writeFileSync(tmpIn, media)

        
        let ffmpegCmd = `ffmpeg -i ${tmpIn} -vcodec libwebp -vf "scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" ${tmpOut}`
        if (isVideo) {
            ffmpegCmd = `ffmpeg -i ${tmpIn} -vcodec libwebp -vf "scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -loop 0 -preset default -an -vsync 0 ${tmpOut}`
        }

        await execPromise(ffmpegCmd)

        if (fs.existsSync(tmpOut)) {
            let buffer = fs.readFileSync(tmpOut)
            await conn.sendMessage(m.chat, { sticker: buffer }, { quoted: m })
            await m.react('🖤')
        } else {
            throw new Error('Fallo en la salida del archivo procesado.')
        }

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply(`❌ No pude procesar el sticker. Asegúrate de que el formato multimedia no esté dañado.\n\n— _Shizuku · Araña Nº8 · guarda silencio_ 🕷️`)
    } finally {
        if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn)
        if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut)
    }
}

handler.help = ['s', 'sticker', 'stiker']
handler.tags = ['stickers']
handler.command = ['s', 'sticker', 'stiker']

export default handler
