import axios from 'axios'
import yts from 'yt-search'

const TIMEOUT = 12000
const isYtUrl = s => /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i.test(s)
const HEADER  = () => `🕷 *${global.botTag}*\n┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄`
const FOOTER  = () => `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n${global.author}`

function extractDl(d) {
    return d?.dl || d?.download || d?.url || d?.link || d?.download_url ||
           d?.video_url || d?.videoUrl || d?.mp4 || null
}

function normalize(raw, source) {
    const d  = raw?.data || raw?.result || raw
    const dl = extractDl(d) || extractDl(raw)
    if (!dl || !/^https?:\/\//i.test(dl)) throw new Error(`${source}: sin URL válida`)
    return {
        title:     d?.title     || d?.name      || raw?.title    || 'Sin título',
        author:    d?.author    || d?.channel   || d?.uploader   || raw?.author   || 'N/A',
        duration:  d?.duration  || d?.length    || raw?.duration || 'N/A',
        size:      d?.size      || d?.filesize  || raw?.size     || 'N/A',
        quality:   d?.quality   || d?.resolution|| raw?.quality  || 'SD',
        thumbnail: d?.thumbnail || d?.thumb     || d?.image      || d?.cover      || raw?.thumbnail || null,
        dl
    }
}

const SOURCES = [
    async ({ ytUrl, query }) => {
        const key = global.apiConfigs?.alyacore?.key || 'Shizuku-bot'
        const { data } = await axios.get('https://api.alyacore.xyz/dl/youtubeplayv2', {
            params: { query: ytUrl || query, type: 'mp4', quality: 'auto', key },
            timeout: TIMEOUT
        })
        if (!data?.status) throw new Error(data?.message || 'alyacore-v2: sin status')
        return normalize(data, 'alyacore-v2')
    },

    async ({ ytUrl }) => {
        if (!ytUrl) throw new Error('alyacore-ytmp4: requiere URL')
        const key = global.apiConfigs?.alyacore?.key || 'Shizuku-bot'
        const { data } = await axios.get('https://api.alyacore.xyz/dl/ytmp4', {
            params: { url: ytUrl, quality: '480', key },
            timeout: TIMEOUT
        })
        if (!data?.status) throw new Error(data?.message || 'alyacore-ytmp4: sin status')
        return normalize(data, 'alyacore-ytmp4')
    },

    async ({ ytUrl }) => {
        if (!ytUrl) throw new Error('apifaa: requiere URL')
        const { data } = await axios.get('https://api-faa.my.id/faa/ytmp4', {
            params: { url: ytUrl },
            timeout: TIMEOUT
        })
        console.log('[APIFAA RAW]', JSON.stringify(data).slice(0, 300))
        return normalize(data, 'apifaa')
    }
]

function raceAll(params) {
    return new Promise((resolve, reject) => {
        let failed = 0
        for (const src of SOURCES) {
            src(params)
                .then(info => resolve(info))
                .catch(e => {
                    console.log('[SOURCE FAIL]', e.message)
                    if (++failed === SOURCES.length)
                        reject(new Error('Todas las fuentes fallaron'))
                })
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
    const isUrl = isYtUrl(query)

    // yts y las APIs corren en paralelo desde el inicio
    // yts solo se necesita para búsquedas de texto, no para URLs directas
    const ytsPromise = isUrl
        ? Promise.resolve({ ytUrl: query, thumb: null })
        : yts(query).then(r => {
            if (!r?.videos?.length) throw new Error('Sin resultados en YouTube')
            return {
                ytUrl: r.videos[0].url,
                thumb: r.videos[0].thumbnail || r.videos[0].image || null
            }
          })

    let ytUrl, thumbFallback
    try {
        const r  = await ytsPromise
        ytUrl    = r.ytUrl
        thumbFallback = r.thumb
    } catch {
        await m.react('❌')
        return m.reply(`${HEADER()}\n🕸 Sin resultados para: *${query}*\n${FOOTER()}`)
    }

    let info
    try {
        info = await raceAll({ ytUrl, query })
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
        // Thumbnail primero — el usuario ve la info mientras el video se sube
        await (thumb
            ? conn.sendMessage(m.chat, { image: { url: thumb }, caption }, { quoted: m })
            : conn.sendMessage(m.chat, { text: caption }, { quoted: m })
        )
        await conn.sendMessage(m.chat, { video: { url: info.dl }, mimetype: 'video/mp4' }, { quoted: m })
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
