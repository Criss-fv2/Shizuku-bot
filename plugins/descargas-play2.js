import axios from 'axios'

const API_KEY = 'Shizuku-System'
const API_SEARCH = `https://api.alyacore.xyz/dl/youtubeplayv2`
const API_URL    = `https://api.alyacore.xyz/dl/ytmp4`


async function downloadByUrl(url, quality = '480') {
    const { data } = await axios.get(API_URL, {
        params: { url, quality, key: API_KEY },
        timeout: 20000
    })
    if (!data?.status) throw new Error(data?.message || 'Error en la API')
    const dl = data?.data?.dl || data?.data?.download || data?.data?.url
    if (!dl) throw new Error('La API no devolvió URL de descarga')
    return {
        title:     data.data?.title    || 'Sin título',
        author:    data.data?.author   || 'Desconocido',
        duration:  data.data?.duration || 'N/A',
        size:      data.data?.size     || 'N/A',
        quality:   data.data?.quality  || quality + 'p',
        dl
    }
}


async function downloadBySearch(query) {
    const { data } = await axios.get(API_SEARCH, {
        params: { query, type: 'mp4', quality: 'auto', key: API_KEY },
        timeout: 20000
    })
    if (!data?.status) throw new Error(data?.message || 'Error en la API')
    const dl = data?.data?.dl || data?.data?.download || data?.data?.url
    if (!dl) throw new Error('La API no devolvió URL de descarga')
    return {
        title:    data.data?.title    || query,
        author:   data.data?.author   || 'Desconocido',
        duration: data.data?.duration || 'N/A',
        size:     data.data?.size     || 'N/A',
        quality:  data.data?.quality  || 'Auto',
        dl
    }
}


const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(
        `🕷 *${global.botTag}*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `🕸 Ingresa una búsqueda o URL de YouTube\n\n` +
        `🕷 Búsqueda: *${usedPrefix}${command} Imagine Dragons*\n` +
        `🕸 URL directa: *${usedPrefix}${command} https://youtu.be/...*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `${global.author}`
    )

    await m.react('📥')

    const isUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(text.trim())

    try {
        const info = isUrl
            ? await downloadByUrl(text.trim())
            : await downloadBySearch(text.trim())

        const caption =
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 *${info.title}*\n\n` +
            `🕷 Canal: ${info.author}\n` +
            `🕸 Duración: ${info.duration}\n` +
            `🕷 Tamaño: ${info.size}\n` +
            `🕸 Calidad: ${info.quality}\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`

        await conn.sendMessage(m.chat, {
            video: { url: info.dl },
            caption
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error('[PLAY2]', e.message)
        await m.react('❌')
        await m.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 Error al descargar el video\n` +
            `\`${e.message.slice(0, 200)}\`\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
        )
    }
}

handler.help = ['play2 <búsqueda o url>']
handler.tags = ['descargas']
handler.command = ['play2', 'ytmp4', 'ytvideo']

export default handler
