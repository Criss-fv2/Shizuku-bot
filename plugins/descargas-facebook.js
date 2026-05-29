import axios from 'axios'

const isFbUrl = s => /facebook\.com|fb\.watch/i.test(s)
const isUrl   = s => /^https?:\/\//i.test(s)
const HEADER  = () => `✠ ══〔 ${global.namebot || 'S H I Z U K U'} 〕══ ✠`

const UA_LIST = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
]
const ua = () => UA_LIST[Math.floor(Math.random() * UA_LIST.length)]

async function resolveUrl(url) {
    try {
        const r = await axios.get(url, {
            maxRedirects: 10, timeout: 12_000,
            headers: { 'User-Agent': ua() },
            validateStatus: () => true
        })
        return r.request?.res?.responseUrl || r.config?.url || url
    } catch { return url }
}

function extractMp4s(html) {
    const found = new Set()
    const patterns = [
        /https?:\\\/\\\/[^"'\s\\]+\.mp4[^"'\s\\]*/g,
        /"(https?:\/\/[^"]+\.mp4[^"]*)"/g,
        /sd_src_no_ratelimit":"([^"]+)"/g,
        /hd_src_no_ratelimit":"([^"]+)"/g,
        /sd_src":"([^"]+)"/g,
        /hd_src":"([^"]+)"/g,
        /"playable_url":"([^"]+)"/g,
        /"playable_url_quality_hd":"([^"]+)"/g,
        /videoUrl":"([^"]+)"/g,
        /src: '(https?:\/\/[^']+\.mp4[^']*)'/g
    ]
    for (const pat of patterns) {
        for (const m of html.matchAll(pat)) {
            const raw = m[1] || m[0]
            const clean = raw.replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/\\"/g, '')
            if (clean.startsWith('http') && clean.includes('.mp4')) found.add(clean)
        }
    }
    return [...found]
}

async function metodo1_snapsave(url) {
    const r = await axios.post('https://snapsave.app/action.php',
        new URLSearchParams({ url }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': ua(), 'Referer': 'https://snapsave.app/' }, timeout: 20_000 }
    )
    const html = typeof r.data === 'string' ? r.data : JSON.stringify(r.data)
    const links = extractMp4s(html)
    if (!links.length) throw new Error('sin resultado')
    return { hd: links[0], sd: links[1] || null }
}

async function metodo2_getfvid(url) {
    const r = await axios.post('https://www.getfvid.com/downloader',
        new URLSearchParams({ url }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': ua(), 'Referer': 'https://www.getfvid.com/', 'Origin': 'https://www.getfvid.com' }, timeout: 20_000 }
    )
    const links = extractMp4s(r.data)
    if (!links.length) throw new Error('sin resultado')
    return { hd: links[0], sd: links[1] || null }
}

async function metodo3_fdown(url) {
    const r = await axios.post('https://fdown.net/download.php',
        new URLSearchParams({ URLz: url }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': ua(), 'Referer': 'https://fdown.net/', 'Origin': 'https://fdown.net' }, timeout: 20_000 }
    )
    const html = r.data
    const hdM = html.match(/href="(https?:\/\/[^"]+)"[^>]*>\s*Download\s*HD/i)
    const sdM = html.match(/href="(https?:\/\/[^"]+)"[^>]*>\s*Download\s*SD/i)
    const fallback = extractMp4s(html)
    const hd = hdM?.[1] || fallback[0] || null
    const sd = sdM?.[1] || fallback[1] || null
    if (!hd && !sd) throw new Error('sin resultado')
    return { hd, sd }
}

async function metodo4_savefrom(url) {
    const r = await axios.get('https://worker.sf-tools.com/savefrom.php',
        { params: { sf_url: url }, headers: { 'User-Agent': ua(), 'Referer': 'https://en.savefrom.net/' }, timeout: 20_000 }
    )
    const items = r.data?.url || []
    if (!items.length) throw new Error('sin resultado')
    const hd = items.find(i => String(i.id).includes('hd'))?.url || items[0]?.url || null
    const sd = items.find(i => !String(i.id).includes('hd'))?.url || null
    if (!hd) throw new Error('sin enlace hd')
    return { hd, sd }
}

async function metodo5_fbdownloader(url) {
    const r = await axios.post('https://fbdownloader.net/download',
        new URLSearchParams({ url }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': ua(), 'Referer': 'https://fbdownloader.net/' }, timeout: 20_000 }
    )
    const links = extractMp4s(typeof r.data === 'string' ? r.data : JSON.stringify(r.data))
    if (!links.length) throw new Error('sin resultado')
    return { hd: links[0], sd: links[1] || null }
}

async function metodo6_rapidsave(url) {
    const r = await axios.post('https://rapidsave.com/info',
        new URLSearchParams({ url }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': ua(), 'Referer': 'https://rapidsave.com/' }, timeout: 20_000 }
    )
    const data = r.data
    const hd = data?.links?.find(l => l.quality === 'hd')?.url || data?.links?.[0]?.url || null
    const sd = data?.links?.find(l => l.quality === 'sd')?.url || null
    if (!hd) throw new Error('sin resultado')
    return { hd, sd }
}

async function descargarFacebook(url) {
    const metodos = [
        metodo1_snapsave,
        metodo3_fdown,
        metodo2_getfvid,
        metodo4_savefrom,
        metodo5_fbdownloader,
        metodo6_rapidsave
    ]
    let lastErr = 'Error desconocido'
    for (const fn of metodos) {
        try {
            const res = await fn(url)
            if (res?.hd || res?.sd) return res
        } catch (e) { lastErr = e.message }
    }
    throw new Error(lastErr)
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
        if (input.includes('fb.watch') || input.includes('/share/')) {
            input = await resolveUrl(input)
        }

        const resultado = await descargarFacebook(input)
        const videoUrl  = resultado.hd || resultado.sd

        if (!videoUrl) {
            await m.react('❌')
            return m.reply(
                `${HEADER()}\n\n` +
                `⚠️ *No se pudo extraer el video*\n` +
                `💡 El video puede ser privado o solo visible para amigos.\n\n` +
                `_...blinky lo intentó pero no llegó hasta ahí. 🕷️_`
            )
        }

        const calidad = resultado.hd ? '🔵 HD' : '🟡 SD'

        await conn.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption:
                `${HEADER()}\n\n` +
                `✅ *Descarga completada*\n` +
                `🌐 *Fuente:* Facebook\n` +
                `📺 *Calidad:* ${calidad}\n\n` +
                `_${global.textbot || '⸸ Shizuku Murasaki. Araña Nº8.'}_`
        }, { quoted: m })

        await m.react('✅')

        if (resultado.hd && resultado.sd) {
            await conn.sendMessage(m.chat, {
                text:
                    `✠ ══〔 Versión SD 〕══ ✠\n\n` +
                    `📥 Por si el video no cargó bien:\n` +
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

handler.command = ['fb', 'facebook', 'fbdl']
handler.tags    = ['descargas']
handler.help    = ['fb <enlace de Facebook>']

export default handler
