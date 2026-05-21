import fetch from 'node-fetch'
import { format } from 'util'

let handler = async (m, { conn, args }) => {
    const text = args.join(' ')

    if (!/^https?:\/\//.test(text)) return m.reply(
        `🕷 *${global.botTag}*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `🕸 Ingresa una URL válida\n` +
        `🕷 Ejemplo: *${global.prefix}get https://api.ejemplo.com*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `${global.author}`
    )

    await m.react('🕷')

    try {
        let res = await fetch(text)

        if (res.headers.get('content-length') > 100 * 1024 * 1024 * 1024) {
            throw new Error(`Archivo demasiado grande: ${res.headers.get('content-length')} bytes`)
        }

        const contentType = res.headers.get('content-type') || ''

        if (!/text|json/.test(contentType)) {
            if (contentType.includes('image')) {
                await m.react('🕸')
                return await conn.sendMessage(m.chat, { image: { url: text }, caption: `${global.botTag}` }, { quoted: m })
            } else if (contentType.includes('video')) {
                await m.react('🕸')
                return await conn.sendMessage(m.chat, { video: { url: text }, caption: `${global.botTag}` }, { quoted: m })
            } else if (contentType.includes('audio')) {
                await m.react('🕸')
                return await conn.sendMessage(m.chat, { audio: { url: text }, mimetype: 'audio/mpeg', ptt: false }, { quoted: m })
            } else {
                await m.react('🕸')
                return await conn.sendMessage(m.chat, { document: { url: text }, fileName: 'file', caption: `${global.botTag}` }, { quoted: m })
            }
        }

        let buf = await res.buffer()
        let txt

        try {
            const json = JSON.parse(buf + '')

            if (json?.data?.download?.url) {
                const dlUrl = json.data.download.url
                const dlType = json.data.download.type || ''

                if (dlType.includes('audio') || dlUrl.match(/\.(mp3|ogg|wav|aac|flac)(\?|$)/i)) {
                    await m.react('🕸')
                    return await conn.sendMessage(m.chat, {
                        audio: { url: dlUrl },
                        mimetype: 'audio/mpeg',
                        ptt: false
                    }, { quoted: m })
                } else if (dlType.includes('video') || dlUrl.match(/\.(mp4|mkv|webm)(\?|$)/i)) {
                    await m.react('🕸')
                    return await conn.sendMessage(m.chat, {
                        video: { url: dlUrl },
                        caption: json.data.title || global.botTag
                    }, { quoted: m })
                }
            }

            txt = format(json)
        } catch (e) {
            txt = buf + ''
        }

        await m.react('🕸')
        await m.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 *Respuesta:*\n\`\`\`${txt.slice(0, 3000)}\`\`\`\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
        )

    } catch (e) {
        await m.react('🕷')
        await m.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 Error al obtener la URL\n` +
            `\`${String(e.message).slice(0, 200)}\`\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
        )
    }
}

handler.help = ['get <url>']
handler.tags = ['owner']
handler.command = ['get']
handler.owner = true

export default handler
