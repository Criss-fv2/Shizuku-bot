import yts from 'yt-search'
import axios from 'axios'

const API_BASE = 'https://api.alyacore.xyz/dl/ytmp4'
const API_KEY  = global.apiConfigs?.stellar?.extraKey || '1bcd4698ce6c75217275c9607f01fd99'
const YT_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/

const sanitize = (n = 'video') => n.replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 100)

const isYtUrl = str => YT_REGEX.test(str)

async function resolveUrl(query) {
    if (isYtUrl(query)) return { url: query, meta: null }
    const search = await yts(query)
    const video  = search.videos?.[0]
    if (!video) throw new Error('No encontré resultados para esa búsqueda.')
    return { url: video.url, meta: video }
}

async function downloadVideo(ytUrl, quality = 480) {
    const { data } = await axios.get(API_BASE, {
        params: { url: ytUrl, quality, key: API_KEY },
        timeout: 30000
    })
    if (!data?.status) throw new Error(data?.message || 'La API no pudo procesar el video.')
    const videoUrl = data?.result?.download_url || data?.result?.url || data?.download_url || data?.url
    if (!videoUrl) throw new Error('La API no devolvió URL de descarga.')
    return { videoUrl, title: data?.result?.title || data?.title || null }
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
    const query = args.join(' ').trim()

    if (!query)
        return m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝖄𝖔𝖚𝖙𝖚𝖇𝖊 〕══ ✠\n\n` +
            `⸸ Uso:\n` +
            `› *${usedPrefix}${command} nombre del video*\n` +
            `› *${usedPrefix}${command} https://youtube.com/...*\n\n` +
            `_...dame algo con qué trabajar._ 🕷️`
        )

    await m.react('⏳')

    try {
        const { url, meta } = await resolveUrl(query)

        const { videoUrl, title: apiTitle } = await downloadVideo(url)

        const title    = apiTitle || meta?.title || 'Video'
        const author   = meta?.author?.name || 'YouTube'
        const duration = meta?.timestamp || 'N/A'
        const views    = meta?.views ? Number(meta.views).toLocaleString('es-MX') : 'N/A'
        const thumb    = meta?.thumbnail || null

        const caption =
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝖄𝖔𝖚𝖙𝖚𝖇𝖊 〕══ ✠\n\n` +
            `🎬 *${title}*\n` +
            `📺 ${author}\n` +
            `⏱️ ${duration}   👁️ ${views}\n\n` +
            `_${global.dev}_ 🕷️`

        if (thumb) {
            await conn.sendMessage(m.chat, { image: { url: thumb }, caption }, { quoted: m })
        }

        await conn.sendMessage(m.chat, {
            video:    { url: videoUrl },
            mimetype: 'video/mp4',
            fileName: `${sanitize(title)}.mp4`,
            caption:  thumb ? `_${global.dev}_ 🕷️` : caption
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        await m.react('❌')
        m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝖄𝖔𝖚𝖙𝖚𝖇𝖊 〕══ ✠\n\n` +
            `⸸ Error al procesar.\n` +
            `\`${e.message.slice(0, 300)}\`\n\n` +
            `_...intenta con otro link o búsqueda._ 🕷️`
        )
    }
}

handler.help    = ['play2 <título o url>']
handler.tags    = ['descargas']
handler.command = ['play2', 'ytmp4', 'yt']

export default handler
