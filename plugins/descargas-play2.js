import axios from 'axios'


const KEY     = 'Shizuku-bot'
const BASE    = 'https://api.alyacore.xyz/dl'
const TIMEOUT = 12000   


const HEADER = () => `🕷 *${global.botTag}*\n┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄`
const FOOTER = () => `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n${global.author}`

function extractInfo(data) {
    const dl = data?.data?.dl || data?.data?.download || data?.data?.url || data?.data?.link
    if (!data?.status || !dl) throw new Error(data?.message || 'Sin URL de descarga')
    return {
        title:    data.data?.title    || 'Sin título',
        author:   data.data?.author   || 'N/A',
        duration: data.data?.duration || 'N/A',
        size:     data.data?.size     || 'N/A',
        quality:  data.data?.quality  || 'SD',
        dl
    }
}

async function fetchApi1(query) {
    const { data } = await axios.get(`${BASE}/youtubeplayv2`, {
        params: { query, type: 'mp4', quality: 'auto', key: KEY },
        timeout: TIMEOUT
    })
    return extractInfo(data)
}

async function fetchApi2(url) {
    const { data } = await axios.get(`${BASE}/ytmp4`, {
        params: { url, quality: '480', key: KEY },
        timeout: TIMEOUT
    })
    return extractInfo(data)
}


async function raceApis(query) {
    const isUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i.test(query)

    
    if (isUrl) {
        return new Promise((resolve, reject) => {
            let failed = 0
            const total = 2

            fetchApi1(query)
                .then(resolve)
                .catch(() => { if (++failed === total) reject(new Error('Ambas APIs fallaron')) })

            fetchApi2(query)
                .then(info => { /* solo resuelve si Api1 no lo hizo ya */ resolve(info) })
                .catch(() => { if (++failed === total) reject(new Error('Ambas APIs fallaron')) })
        })
    }

    
    return fetchApi1(query)
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

    let info
    try {
        info = await raceApis(text.trim())
    } catch (e) {
        await m.react('❌')
        return m.reply(
            `${HEADER()}\n` +
            `🕸 No se pudo descargar el video\n` +
            `\`${e.message.slice(0, 200)}\`\n` +
            `${FOOTER()}`
        )
    }

    try {
        await conn.sendMessage(m.chat, {
            video: { url: info.dl },
            caption:
                `${HEADER()}\n` +
                `🕸 *${info.title}*\n\n` +
                `🕷 Canal: ${info.author}\n` +
                `🕸 Duración: ${info.duration}\n` +
                `🕷 Tamaño: ${info.size}\n` +
                `🕸 Calidad: ${info.quality}\n` +
                `${FOOTER()}`
        }, { quoted: m })
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
