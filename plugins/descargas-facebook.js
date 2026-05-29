import axios from 'axios'
const FB_API  = 'https://api.alyacore.xyz/dl/facebookv2'
const FB_KEY  = 'Shizuku-System'   


const isFbUrl  = s => /facebook\.com|fb\.watch/i.test(s)
const isUrl    = s => /^https?:\/\//i.test(s)

const HEADER = () =>
    `✠ ══〔 ${global.namebot} 〕══ ✠`


let handler = async (m, { conn, args, usedPrefix, command }) => {
    const prefix = usedPrefix || global.prefix || '.'
    const input  = args.join(' ').trim()

    
    if (!input) {
        return m.reply(
            `${HEADER()}\n\n` +
            `⚠️ *Sin enlace*\n` +
            `📌 Uso: *${prefix}${command} <enlace de Facebook>*\n` +
            `💡 Ejemplo: *${prefix}${command} https://fb.watch/...*\n\n` +
            `_...solo acepto enlaces de Facebook. ${global.botEmoji}_`
        )
    }

    
    if (!isUrl(input)) {
        return m.reply(
            `${HEADER()}\n\n` +
            `❌ *Entrada inválida*\n` +
            `💡 Ingresa un enlace directo de Facebook.\n\n` +
            `_...no reconozco eso como una URL. ${global.botEmoji}_`
        )
    }

    if (!isFbUrl(input)) {
        return m.reply(
            `${HEADER()}\n\n` +
            `❌ *Enlace no válido*\n` +
            `💡 Solo acepto links de *facebook.com* o *fb.watch*\n\n` +
            `_...ese no es un enlace de Facebook. ${global.botEmoji}_`
        )
    }

    
    await m.react('⏳')

    try {
        const { data } = await axios.get(FB_API, {
            params: {
                url: input,
                key: FB_KEY
            },
            timeout: 20_000
        })

        if (!data?.status) {
            await m.react('❌')
            return m.reply(
                `${HEADER()}\n\n` +
                `❌ *Error de API*\n` +
                `📄 ${data?.message || 'Respuesta inválida del servidor.'}\n\n` +
                `_...la araña no encontró nada. ${global.botEmoji}_`
            )
        }

        
        const result   = data.result ?? data.data ?? data
        const videoUrl =
            result?.hd   ||
            result?.sd   ||
            result?.url  ||
            result?.video||
            result?.link ||
            (typeof result === 'string' && isUrl(result) ? result : null)

        if (!videoUrl) {
            await m.react('❌')
            return m.reply(
                `${HEADER()}\n\n` +
                `⚠️ *No se pudo extraer el video*\n` +
                `💡 El video puede ser privado o requerir inicio de sesión.\n\n` +
                `_...blinky lo intentó pero no llegó hasta ahí. ${global.botEmoji}_`
            )
        }

        
        const caption =
            `${HEADER()}\n\n` +
            `✅ *Descarga completada*\n` +
            `🌐 *Fuente:* Facebook\n` +
            `📦 *Calidad:* ${result?.hd ? 'HD' : 'SD'}\n\n` +
            `_${global.textbot}_`

        await conn.sendMessage(m.chat, {
            video   : { url: videoUrl },
            caption : caption
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        await m.react('❌')

        const isTimeout = e.code === 'ECONNABORTED' || e.message?.includes('timeout')
        const msg = isTimeout
            ? `⏱️ *Tiempo de espera agotado*\nLa API tardó demasiado. Inténtalo de nuevo.`
            : `⚠️ *Error de conexión*\n${e.message}`

        return m.reply(
            `${HEADER()}\n\n` +
            `${msg}\n\n` +
            `_...algo salió mal en la red. ${global.botEmoji}_`
        )
    }
}

handler.command  = ['fb', 'facebook']
handler.tags     = ['descargas']
handler.help     = ['fb <enlace de Facebook>']

export default handler
