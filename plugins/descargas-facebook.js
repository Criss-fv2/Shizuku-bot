

import axios from 'axios'

const isFbUrl = s => /facebook\.com|fb\.watch/i.test(s)
const isUrl   = s => /^https?:\/\//i.test(s)

const HEADER = () => `✠ ══〔 ${global.namebot || 'S H I Z U K U'} 〕══ ✠`

async function resolveShortUrl(url) {
    try {
        const res = await axios.get(url, {
            maxRedirects: 10,
            timeout: 10_000,
            headers: { 'User-Agent': UA },
            validateStatus: () => true
        })
        return res.request?.res?.responseUrl || res.config?.url || url
    } catch {
        return url
    }
}


const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'


async function metodoFdown(url) {
    const res = await axios.post('https://fdown.net/download.php',
        new URLSearchParams({ URLz: url }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': UA,
                'Referer': 'https://fdown.net/',
                'Origin': 'https://fdown.net'
            },
            timeout: 20_000
        }
    )
    const html = res.data
    
    const hdMatch = html.match(/href="(https?:\/\/[^"]+)"[^>]*>\s*Download\s*HD/i)
    const sdMatch = html.match(/href="(https?:\/\/[^"]+)"[^>]*>\s*Download\s*SD/i)
    const hd = hdMatch?.[1] || null
    const sd = sdMatch?.[1] || null
    if (!hd && !sd) throw new Error('fdown: no se encontraron enlaces')
    return { hd, sd, titulo: null }
}

async function metodoGetfvid(url) {
    const res = await axios.post('https://www.getfvid.com/downloader',
        new URLSearchParams({ url }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': UA,
                'Referer': 'https://www.getfvid.com/',
                'Origin': 'https://www.getfvid.com'
            },
            timeout: 20_000
        }
    )
    const html = res.data
    const matches = [...html.matchAll(/href="(https?:\/\/[^"]*\.mp4[^"]*)"/gi)]
    const links = matches.map(m => m[1]).filter(Boolean)
    if (!links.length) throw new Error('getfvid: sin resultados')
    // Primer link = HD, segundo = SD si existe
    return { hd: links[0] || null, sd: links[1] || null, titulo: null }
}


async function metodoSavefrom(url) {
    const res = await axios.get('https://worker.sf-tools.com/savefrom.php', {
        params: { sf_url: url },
        headers: {
            'User-Agent': UA,
            'Referer': 'https://en.savefrom.net/',
            'Origin': 'https://en.savefrom.net'
        },
        timeout: 20_000
    })
    const data = res.data
    if (!data?.url?.length) throw new Error('savefrom: sin resultados')
    const items = data.url
    const hd = items.find(i => (i.id || '').includes('hd'))?.url || items[0]?.url || null
    const sd = items.find(i => !(i.id || '').includes('hd'))?.url || null
    const titulo = data.meta?.title || null
    if (!hd) throw new Error('savefrom: sin enlace')
    return { hd, sd, titulo }
}


async function metodoFbvd(url) {
    const res = await axios.post('https://fbvideodownloader.net/download.php',
        new URLSearchParams({ url }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': UA,
                'Referer': 'https://fbvideodownloader.net/',
                'Origin': 'https://fbvideodownloader.net'
            },
            timeout: 20_000
        }
    )
    const html = res.data
    const hdMatch = html.match(/href="(https?:\/\/[^"]+)"[^>]*>.*?HD/i)
    const sdMatch = html.match(/href="(https?:\/\/[^"]+)"[^>]*>.*?SD/i)
    const hd = hdMatch?.[1] || null
    const sd = sdMatch?.[1] || null
    if (!hd && !sd) throw new Error('fbvd: sin resultados')
    return { hd, sd, titulo: null }
}


async function metodoSnapsave(url) {
    const res = await axios.post('https://snapsave.app/action.php',
        new URLSearchParams({ url }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': UA,
                'Referer': 'https://snapsave.app/',
                'Origin': 'https://snapsave.app'
            },
            timeout: 20_000
        }
    )
    const html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
    const matches = [...html.matchAll(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/gi)]
    const links = [...new Set(matches.map(m => m[0]))]
    if (!links.length) throw new Error('snapsave: sin resultados')
    return { hd: links[0], sd: links[1] || null, titulo: null }
}


async function descargarFacebook(url) {
    const metodos = [
        { nombre: 'SnapSave',         fn: metodoSnapsave  },
        { nombre: 'SaveFrom',         fn: metodoSavefrom  },
        { nombre: 'Fdown',            fn: metodoFdown     },
        { nombre: 'GetFvid',          fn: metodoGetfvid   },
        { nombre: 'FbVideoDown',      fn: metodoFbvd      },
    ]

    let lastError = null
    for (const { nombre, fn } of metodos) {
        try {
            const result = await fn(url)
            result._metodo = nombre
            return result
        } catch (e) {
            lastError = e
            // 
        }
    }
    throw new Error(`Todos los métodos fallaron. Último error: ${lastError?.message}`)
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const prefix = usedPrefix || '.'
    let input = args.join(' ').trim()

    
    if (!input) {
        return m.reply(
            `${HEADER()}\n\n` +
            `⚠️ *Sin enlace*\n` +
            `📌 Uso: *${prefix}${command} <enlace de Facebook>*\n` +
            `💡 Ejemplo: *${prefix}${command} https://fb.watch/...*\n\n` +
            `_...solo acepto enlaces de Facebook. 🕷️_`
        )
    }

    
    if (!isUrl(input) || !isFbUrl(input)) {
        return m.reply(
            `${HEADER()}\n\n` +
            `❌ *Enlace no válido*\n` +
            `💡 Solo acepto links de *facebook.com* o *fb.watch*\n\n` +
            `_...ese no es un enlace de Facebook. 🕷️_`
        )
    }

    await m.react('⏳')

    try {
        
        if (input.includes('fb.watch')) {
            input = await resolveShortUrl(input)
        }

        const resultado = await descargarFacebook(input)

        const videoUrl = resultado.hd || resultado.sd
        if (!videoUrl) {
            await m.react('❌')
            return m.reply(
                `${HEADER()}\n\n` +
                `⚠️ *No se pudo extraer el video*\n` +
                `💡 El video puede ser privado, solo para amigos o requerir sesión iniciada.\n\n` +
                `_...blinky lo intentó pero no llegó hasta ahí. 🕷️_`
            )
        }

        const calidad = resultado.hd ? '🔵 HD' : '🟡 SD'
        const titulo  = resultado.titulo ? `📝 *Título:* ${resultado.titulo}\n` : ''

        const caption =
            `${HEADER()}\n\n` +
            `✅ *Descarga completada*\n` +
            `🌐 *Fuente:* Facebook\n` +
            `${titulo}` +
            `📺 *Calidad:* ${calidad}\n\n` +
            `_${global.textbot || '⸸ Shizuku Murasaki. Araña Nº8.'}_`

        await conn.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption
        }, { quoted: m })

        await m.react('✅')

        
        if (resultado.hd && resultado.sd) {
            await conn.sendMessage(m.chat, {
                text:
                    `✠ ══〔 Versión SD disponible 〕══ ✠\n\n` +
                    `📥 Si el video de arriba no cargó bien, aquí tienes la versión SD:\n` +
                    `🔗 ${resultado.sd}\n\n` +
                    `_...por si las arañas necesitan menos peso. 🕸️_`
            }, { quoted: m })
        }

    } catch (e) {
        await m.react('❌')
        return m.reply(
            `${HEADER()}\n\n` +
            `⚠️ *No se pudo descargar el video*\n\n` +
            `📋 *Posibles causas:*\n` +
            `• El video es privado o solo para amigos\n` +
            `• El enlace está caído o expiró\n` +
            `• Facebook bloqueó el acceso temporalmente\n\n` +
            `_...la red de Blinky no llegó hasta allá. 🕷️_`
        )
    }
}

handler.command  = ['fb', 'facebook', 'fbdl']
handler.tags     = ['descargas']
handler.help     = ['fb <enlace de Facebook>']

export default handler
