import axios from 'axios'
import yts from 'yt-search'

const TIMEOUT  = 12000
const isYtUrl  = s => /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i.test(s)
const HEADER   = () => `🕷 *${global.botTag}*\n┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄`
const FOOTER   = () => `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n${global.author}`

const normalize = (data, source) => {
    const d   = data?.data || data?.result || data
    const dl  = d?.dl || d?.download || d?.url || d?.link || d?.download_url
    if (!dl) throw new Error(`${source}: sin URL`)
    return {
        title:     d?.title     || 'Sin título',
        author:    d?.author    || d?.channel || 'N/A',
        duration:  d?.duration  || 'N/A',
        size:      d?.size      || 'N/A',
        quality:   d?.quality   || 'SD',
        thumbnail: d?.thumbnail || d?.thumb   || null,
        dl
    }
}

const SOURCES = [
    async ({ query, url }) => {
        const key    = global.apiConfigs?.alyacore?.key || 'Shizuku-bot'
        const { data } = await axios.get('https://api.alyacore.xyz/dl/youtubeplayv2', {
            params: { query: url || query, type: 'mp4', quality: 'auto', key },
            timeout: TIMEOUT
        })
        if (!data?.status) throw new Error(data?.message || 'alyacore v2: sin status')
        return normalize(data, 'alyacore-v2')
    },

    async ({ url }) => {
        if (!url) throw new Error('ytmp4: solo URLs')
        const key    = global.apiConfigs?.alyacore?.key || 'Shizuku-bot'
        const { data } = await axios.get('https://api.alyacore.xyz/dl/ytmp4', {
            params: { url, quality: '480', key },
            timeout: TIMEOUT
        })
        if (!data?.status) throw new Error(data?.message || 'alyacore ytmp4: sin status')
        return normalize(data, 'alyacore-ytmp4')
    },

    async ({ url }) => {
        if (!url) throw new Error('apifaa: solo URLs')
        const { data } = await axios.get(`https://api-faa.my.id/faa/ytmp4`, {
            params: { url },
            timeout: TIMEOUT
        })
        return normalize(data, 'apifaa')
    }
]

function raceAll(params) {
    return new Promise((resolve, reject) => {
        let failed = 0
        for (const source of SOURCES) {
            source(params)
                .then(info => resolve(info))
                .catch(() => { if (++failed === SOURCES.length) reject(new Error('Sin resultados en todas las fuentes')) })
        }
    })
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(
        `${HEADER()}\n` +
        `🕸 Ingresa una búsqueda o URL de YouTube\n\n` +
        `🕷 *${usedPrefix}${command} noche de los dos*\n` +
        `🕸 *${usedPrefix}${command} https://youtu.be/...*\n` +
        `${FOOTER()}`
    )

    await m.react('📥')

    const query = text.trim()
    const url   = isYtUrl(query) ? query : null

    let ytUrl         = url
    let thumbFallback = null

    if (!url) {
        try {
            const { videos } = await yts(query)
            if (!videos?.length) throw new Error()
            ytUrl         = videos[0].url
            thumbFallback = videos[0].thumbnail || videos[0].image || null
        } catch {
            await m.react('❌')
            return m.reply(`${HEADER()}\n🕸 Sin resultados para: *${query}*\n${FOOTER()}`)
        }
    }

    let info
    try {
        info = await raceAll({ url: ytUrl, query })
    } catch (e) {
        await m.react('❌')
        return m.reply(`${HEADER()}\n🕸 No se pudo descargar el video\n\`${e.message.slice(0, 200)}\`\n${FOOTER()}`)
    }

    const thumb   = info.thumbnail || thumbFallback
    const caption =
        `${HEADER()}\n` +
        `🕸 *${info.title}*\n\n` +
        `🕷 Canal: ${info.author}\n` +
        `🕸 Duración: ${info.duration}\n` +
        `🕷 Tamaño: ${info.size}\n` +
        `🕸 Calidad: ${info.quality}\n` +
        `${FOOTER()}`

    try {
        await Promise.all([
            thumb
                ? conn.sendMessage(m.chat, { image: { url: thumb }, caption }, { quoted: m })
                : conn.sendMessage(m.chat, { text: caption }, { quoted: m }),
            conn.sendMessage(m.chat, { video: { url: info.dl }, mimetype: 'video/mp4' }, { quoted: m })
        ])
        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        await m.reply(`${HEADER()}\n🕸 Error al enviar el video\n\`${e.message.slice(0, 200)}\`\n${FOOTER()}`)
    }
}

handler.help    = ['play2 <búsqueda o url>']
handler.tags    = ['descargas']
handler.command = ['play2', 'ytmp4', 'ytvideo']

export default handler
