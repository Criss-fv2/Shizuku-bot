import axios from 'axios'

const KEY = 'Shizuku-bot'

const fetchApi1 = query => axios.get('https://api.alyacore.xyz/dl/youtubeplayv2', {
    params: { query, type: 'mp4', quality: 'auto', key: KEY },
    timeout: 15000
}).then(r => r.data)

const fetchApi2 = url => axios.get('https://api.alyacore.xyz/dl/ytmp4', {
    params: { url, quality: '480', key: KEY },
    timeout: 15000
}).then(r => r.data)

const extractInfo = data => {
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
    const errores = []
    let info = null

    try {
        info = extractInfo(await fetchApi1(query))
    } catch (e) {
        errores.push(e.message)
        if (isUrl) {
            try {
                info = extractInfo(await fetchApi2(query))
            } catch (e2) {
                errores.push(e2.message)
            }
        }
    }

    if (!info) {
        await m.react('❌')
        return m.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 No se pudo descargar el video\n\n` +
            errores.map((e, i) => `🕷 Error ${i + 1}: \`${e.slice(0, 150)}\``).join('\n') + '\n' +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
        )
    }

    try {
        await conn.sendMessage(m.chat, {
            video: { url: info.dl },
            caption:
                `🕷 *${global.botTag}*\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `🕸 *${info.title}*\n\n` +
                `🕷 Canal: ${info.author}\n` +
                `🕸 Duración: ${info.duration}\n` +
                `🕷 Tamaño: ${info.size}\n` +
                `🕸 Calidad: ${info.quality}\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `${global.author}`
        }, { quoted: m })
        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        await m.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 Error al enviar el video\n` +
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
