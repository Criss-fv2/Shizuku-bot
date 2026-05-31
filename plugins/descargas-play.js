import axios from 'axios'
import yts from 'yt-search'


const KEY     = 'Shizuku-bot'
const BASE    = 'https://api.alyacore.xyz/dl'
const TIMEOUT = 12000   


const HEADER = () => `🕷 *${global.botTag}*\n┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄`
const FOOTER = () => `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n${global.author}`

async function fetchEndpoint(endpoint, url) {
    const { data } = await axios.get(`${BASE}/${endpoint}`, {
        params: { url, key: KEY },
        timeout: TIMEOUT
    })
    const dl = data?.data?.dl || data?.data?.download || data?.data?.url || data?.data?.link
    if (!data?.status || !dl) throw new Error(data?.message || `${endpoint}: sin URL`)
    return dl
}


async function raceApis(ytUrl) {
    const apis = ['ytmp3', 'ytmp3v2', 'ytmp3v3']

    return new Promise((resolve, reject) => {
        let settled = false
        let failed  = 0

        for (const ep of apis) {
            fetchEndpoint(ep, ytUrl)
                .then(dl => {
                    if (!settled) { settled = true; resolve(dl) }
                })
                .catch(() => {
                    failed++
                    if (failed === apis.length && !settled)
                        reject(new Error('Todas las APIs fallaron'))
                })
        }
    })
}


const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(
        `${HEADER()}\n` +
        `🕸 Ingresa una búsqueda o URL de YouTube\n\n` +
        `🕷 Búsqueda: *${usedPrefix}${command} ella*\n` +
        `🕸 URL: *${usedPrefix}${command} https://youtu.be/...*\n` +
        `${FOOTER()}`
    )

    await m.react('📥')

    const query = text.trim()
    const isUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i.test(query)

    let ytUrl     = query
    let videoInfo = null

    
    if (!isUrl) {
        try {
            const { videos } = await yts(query)
            if (!videos?.length) throw new Error('Sin resultados')
            const v  = videos[0]
            ytUrl    = v.url
            videoInfo = {
                title:     v.title,
                author:    v.author?.name || 'N/A',
                views:     v.views?.toLocaleString('es') || 'N/A',
                date:      v.ago || 'N/A',
                duration:  v.timestamp || 'N/A',
                thumbnail: v.thumbnail || v.image || null
            }
        } catch {
            await m.react('❌')
            return m.reply(
                `${HEADER()}\n` +
                `🕸 Sin resultados para: *${query}*\n` +
                `${FOOTER()}`
            )
        }
    }

    
    if (videoInfo) {
        const infoMsg =
            `${HEADER()}\n` +
            `🕸 *${videoInfo.title}*\n\n` +
            `🕷 Canal: ${videoInfo.author}\n` +
            `🕸 Duración: ${videoInfo.duration}\n` +
            `🕷 Vistas: ${videoInfo.views}\n` +
            `🕸 Publicado: ${videoInfo.date}\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕷 Descargando audio...`

        // Enviar info + lanzar carrera de APIs al mismo tiempo
        const [, dlUrl] = await Promise.all([
            videoInfo.thumbnail
                ? conn.sendMessage(m.chat, { image: { url: videoInfo.thumbnail }, caption: infoMsg }, { quoted: m })
                : conn.sendMessage(m.chat, { text: infoMsg }, { quoted: m }),
            raceApis(ytUrl)
        ]).catch(async e => {
            await m.react('❌')
            await m.reply(
                `${HEADER()}\n🕸 No se pudo descargar el audio\n\`${e.message.slice(0, 200)}\`\n${FOOTER()}`
            )
            return [null, null]
        })

        if (!dlUrl) return

        await conn.sendMessage(m.chat, {
            audio: { url: dlUrl },
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: m })

        return await m.react('✅')
    }

    
    let dlUrl
    try {
        dlUrl = await raceApis(ytUrl)
    } catch (e) {
        await m.react('❌')
        return m.reply(
            `${HEADER()}\n🕸 No se pudo descargar el audio\n\`${e.message.slice(0, 200)}\`\n${FOOTER()}`
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
            `${HEADER()}\n🕸 Error al enviar el audio\n\`${e.message.slice(0, 200)}\`\n${FOOTER()}`
        )
    }
}

handler.help    = ['play <búsqueda o url>']
handler.tags    = ['descargas']
handler.command = ['play', 'ytmp3']

export default handler
