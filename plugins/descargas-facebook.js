import axios from 'axios'

const FB_API  = 'https://api.alyacore.xyz/dl/facebook'
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

    if (!isUrl(input) || !isFbUrl(input)) {
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

        const resultados = data.resultados || []
        const videoUrl = resultados.find(v => v.quality?.includes('HD'))?.url 
                      || resultados[0]?.url 

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
            `🌐 *Fuente:* Facebook\n\n` +
            `_${global.textbot}_`

        await conn.sendMessage(m.chat, {
            video   : { url: videoUrl },
            caption : caption
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        await m.react('❌')
        return m.reply(
            `${HEADER()}\n\n` +
            `⚠️ *Error de conexión*\n${e.message}\n\n` +
            `_...algo salió mal en la red. ${global.botEmoji}_`
        )
    }
}

handler.command  = ['fb', 'facebook']
handler.tags     = ['descargas']
handler.help     = ['fb <enlace de Facebook>']

export default handler
