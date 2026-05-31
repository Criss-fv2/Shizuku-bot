import axios from 'axios'
import yts from 'yt-search'

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const TIMEOUT = 13000

// Todas las fuentes de video en paralelo.
// Cada función recibe { url?, query? } y devuelve { title, author, duration, size, quality, dl, thumbnail? }
// Si una falla (rate limit, error, etc.) se ignora — gana la primera que responda.
const SOURCES = [
    // alyacore — youtubeplayv2 (soporta búsqueda y URL)
    async ({ query }) => {
        const key = global.apiConfigs?.alyacore?.key || 'Shizuku-bot'
        const { data } = await axios.get('https://api.alyacore.xyz/dl/youtubeplayv2', {
            params: { query, type: 'mp4', quality: 'auto', key },
            timeout: TIMEOUT
        })
        const dl = data?.data?.dl || data?.data?.download || data?.data?.url || data?.data?.link
        if (!data?.status || !dl) throw new Error(data?.message || 'alyacore: sin URL')
        return {
            title:     data.data?.title    || 'Sin título',
            author:    data.data?.author   || 'N/A',
            duration:  data.data?.duration || 'N/A',
            size:      data.data?.size     || 'N/A',
            quality:   data.data?.quality  || 'SD',
            thumbnail: data.data?.thumbnail || data.data?.thumb || null,
            dl
        }
    },

    // alyacore — ytmp4 (solo URL)
    async ({ url }) => {
        if (!url) throw new Error('ytmp4: requiere URL')
        const key = global.apiConfigs?.alyacore?.key || 'Shizuku-bot'
        const { data } = await axios.get('https://api.alyacore.xyz/dl/ytmp4', {
            params: { url, quality: '480', key },
            timeout: TIMEOUT
        })
        const dl = data?.data?.dl || data?.data?.download || data?.data?.url || data?.data?.link
        if (!data?.status || !dl) throw new Error(data?.message || 'ytmp4: sin URL')
        return {
            title:     data.data?.title    || 'Sin título',
            author:    data.data?.author   || 'N/A',
            duration:  data.data?.duration || 'N/A',
            size:      data.data?.size     || 'N/A',
            quality:   data.data?.quality  || 'SD',
            thumbnail: data.data?.thumbnail || data.data?.thumb || null,
            dl
        }
    },

    // siputzx — endpoint ytdlmp4 (no requiere key)
    async ({ url, query }) => {
        const q = url || query
        const { data } = await axios.get('https://api.siputzx.my.id/api/d/ytmp4', {
            params: { url: q },
            timeout: TIMEOUT
        })
        const dl = data?.data?.url || data?.data?.dl || data?.url
        if (!data?.status || !dl) throw new Error('siputzx: sin URL')
        return {
            title:     data.data?.title    || 'Sin título',
            author:    data.data?.author   || 'N/A',
            duration:  data.data?.duration || 'N/A',
            size:      data.data?.size     || 'N/A',
            quality:   '480p',
            thumbnail: data.data?.thumbnail || null,
            dl
        }
    },

    // vreden — endpoint yt-video (no requiere key)
    async ({ url, query }) => {
        const q = url || query
        const { data } = await axios.get('https://api.vreden.web.id/api/ytdlmp4', {
            params: { url: q },
            timeout: TIMEOUT
        })
        const dl = data?.result?.url || data?.data?.url || data?.url
        if (!dl) throw new Error('vreden: sin URL')
        return {
            title:     data.result?.title    || data.data?.title    || 'Sin título',
            author:    data.result?.author   || data.data?.channel  || 'N/A',
            duration:  data.result?.duration || data.data?.duration || 'N/A',
            size:      data.result?.size     || data.data?.size     || 'N/A',
            quality:   '360p',
            thumbnail: data.result?.thumbnail || data.data?.thumbnail || null,
            dl
        }
    }
]

// ─── RACE — primera fuente que responda con éxito gana ────────────────────────
function raceAll(params) {
    return new Promise((resolve, reject) => {
        let failed = 0
        const total = SOURCES.length

        for (const source of SOURCES) {
            source(params)
                .then(info => resolve(info))
                .catch(() => {
                    if (++failed === total)
                        reject(new Error('Todas las fuentes fallaron. Intenta con una URL directa.'))
                })
        }
    })
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const HEADER = () => `🕷 *${global.botTag}*\n┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄`
const FOOTER = () => `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n${global.author}`
const isYtUrl = s => /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i.test(s)

// ─── HANDLER ─────────────────────────────────────────────────────────────────
const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(
        `${HEADER()}\n` +
        `🕸 Ingresa una búsqueda o URL de YouTube\n\n` +
        `🕷 Búsqueda: *${usedPrefix}${command} noche de los dos*\n` +
        `🕸 URL: *${usedPrefix}${command} https://youtu.be/...*\n` +
        `${FOOTER()}`
    )

    await m.react('📥')

    const query = text.trim()
    const url   = isYtUrl(query) ? query : null

    // ── Si es búsqueda de texto, obtener URL real con yts ─────────────────────
    let ytUrl     = url
    let thumbFallback = null

    if (!url) {
        try {
            const { videos } = await yts(query)
            if (!videos?.length) throw new Error('Sin resultados')
            const v       = videos[0]
            ytUrl         = v.url
            thumbFallback = v.thumbnail || v.image || null
        } catch {
            await m.react('❌')
            return m.reply(
                `${HEADER()}\n` +
                `🕸 Sin resultados para: *${query}*\n` +
                `${FOOTER()}`
            )
        }
    }

    // ── Lanzar todas las fuentes en paralelo ──────────────────────────────────
    let info
    try {
        info = await raceAll({ url: ytUrl, query: query })
    } catch (e) {
        await m.react('❌')
        return m.reply(
            `${HEADER()}\n` +
            `🕸 No se pudo descargar el video\n` +
            `\`${e.message.slice(0, 200)}\`\n` +
            `${FOOTER()}`
        )
    }

    const thumb = info.thumbnail || thumbFallback

    // ── 1. Enviar thumbnail con info ──────────────────────────────────────────
    const caption =
        `${HEADER()}\n` +
        `🕸 *${info.title}*\n\n` +
        `🕷 Canal: ${info.author}\n` +
        `🕸 Duración: ${info.duration}\n` +
        `🕷 Tamaño: ${info.size}\n` +
        `🕸 Calidad: ${info.quality}\n` +
        `${FOOTER()}`

    // Enviar thumbnail + descargar video EN PARALELO para no perder tiempo
    const sendThumb = thumb
        ? conn.sendMessage(m.chat, { image: { url: thumb }, caption }, { quoted: m })
        : conn.sendMessage(m.chat, { text: caption }, { quoted: m })

    // ── 2. Enviar video (en paralelo con el thumb) ────────────────────────────
    try {
        await Promise.all([
            sendThumb,
            conn.sendMessage(m.chat, {
                video: { url: info.dl },
                mimetype: 'video/mp4'
            }, { quoted: m })
        ])
        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        await m.reply(
            `${HEADER()}\n🕸 Error al enviar el video\n\`${e.message.slice(0, 200)}\`\n${FOOTER()}`
        )
    }
}

handler.help    = ['play2 <búsqueda o url>']
handler.tags    = ['descargas']
handler.command = ['play2', 'ytmp4', 'ytvideo']

export default handler
