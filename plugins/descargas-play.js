import axios from 'axios'
import yts from 'yt-search'

const KEY = 'Shizuku-bot'

const fetchMp3 = (endpoint, url) => axios.get(`https://api.alyacore.xyz/dl/${endpoint}`, {
    params: { url, key: KEY },
    timeout: 20000
}).then(r => r.data)

const extractDl = data => {
    const dl = data?.data?.dl || data?.data?.download || data?.data?.url || data?.data?.link
    if (!data?.status || !dl) throw new Error(data?.message || 'Sin URL de descarga')
    return dl
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(
        `🕷 *${global.botTag}*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `🕸 Ingresa una búsqueda o URL de YouTube\n\n` +
        `🕷 Búsqueda: *${usedPrefix}${command} ella*\n` +
        `🕸 URL: *${usedPrefix}${command} https://youtu.be/...*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `${global.author}`
    )

    await m.react('📥')

    const query = text.trim()
    const isUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i.test(query)

    let videoInfo = null
    let ytUrl = query

    // Si es búsqueda, obtener URL y datos del video con yt-search
    if (!isUrl) {
        try {
            const { videos } = await yts(query)
            if (!videos?.length) throw new Error('No se encontraron resultados')
            const v = videos[0]
            ytUrl = v.url
            videoInfo = {
                title:     v.title,
                author:    v.author?.name || 'N/A',
                views:     v.views?.toLocaleString('es') || 'N/A',
                date:      v.ago || 'N/A',
                duration:  v.timestamp || 'N/A',
                thumbnail: v.thumbnail || v.image || null
            }
        } catch (e) {
            await m.react('❌')
            return m.reply(
                `🕷 *${global.botTag}*\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `🕸 No se encontraron resultados para:\n*${query}*\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `${global.author}`
            )
        }
    }

    // Enviar info del video antes de descargar
    if (videoInfo) {
        const infoMsg =
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 *${videoInfo.title}*\n\n` +
            `🕷 Canal: ${videoInfo.author}\n` +
            `🕸 Duración: ${videoInfo.duration}\n` +
            `🕷 Vistas: ${videoInfo.views}\n` +
            `🕸 Publicado: ${videoInfo.date}\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕷 Descargando audio...`

        if (videoInfo.thumbnail) {
            await conn.sendMessage(m.chat, {
                image: { url: videoInfo.thumbnail },
                caption: infoMsg
            }, { quoted: m })
        } else {
            await conn.sendMessage(m.chat, { text: infoMsg }, { quoted: m })
        }
    }

    // Descargar con las 3 APIs en orden
    const errores = []
    let dlUrl = null

    for (const [i, ep] of ['ytmp3', 'ytmp3v2', 'ytmp3v3'].entries()) {
        try {
            dlUrl = extractDl(await fetchMp3(ep, ytUrl))
            break
        } catch (e) {
            errores.push(`API${i + 1}: ${e.message}`)
        }
    }

    if (!dlUrl) {
        await m.react('❌')
        return m.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 No se pudo descargar el audio\n\n` +
            errores.map((e, i) => `🕷 Error ${i + 1}: \`${e.slice(0, 150)}\``).join('\n') + '\n' +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
        )
    }

    try {
        await conn.sendMessage(m.chat, {
            audio: { url: dlUrl },
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: m })
        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        await m.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 Error al enviar el audio\n` +
            `\`${e.message.slice(0, 200)}\`\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
        )
    }
}

handler.help = ['play <búsqueda o url>']
handler.tags = ['descargas']
handler.command = ['play', 'ytmp3', 'música', 'musica']

export default handler
