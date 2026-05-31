import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { database } from '../lib/database.js'

const BASE = 'https://www.xnxx.com'
const UA   = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

function parseInfo(infoStr = '') {
    const lines = infoStr.split('\n').map(v => v.trim()).filter(Boolean)
    const [line1, line2] = lines
    let dur = '', qual = '', views = ''
    if (line1) {
        const m = line1.match(/(\d+\s?min)/i)
        dur = m ? m[1] : ''
    }
    if (line2) {
        const parts = line2.split('-').map(v => v.trim()).filter(Boolean)
        if (parts.length >= 2) { qual = parts[0]; views = parts[1] }
        else if (parts.length === 1) qual = parts[0]
    }
    return { dur, qual, views }
}

async function xnxxdl(URL) {
    const res  = await fetch(URL, { headers: { 'User-Agent': UA }, timeout: 15000 })
    const html = await res.text()
    const $    = cheerio.load(html, { xmlMode: false })

    const title    = $('meta[property="og:title"]').attr('content') || 'Video'
    const durRaw   = parseInt($('meta[property="og:duration"]').attr('content'), 10) || 0
    const duration = durRaw >= 3600
        ? `${Math.floor(durRaw / 3600)}h ${Math.floor((durRaw % 3600) / 60)}m`
        : `${Math.floor(durRaw / 60)}m ${durRaw % 60}s`
    const image    = $('meta[property="og:image"]').attr('content')
    const info     = $('span.metadata').text()
    const script   = $('#video-player-bg > script:nth-child(6)').html() || ''

    const files = {
        low:          (script.match(/html5player\.setVideoUrlLow\('(.*?)'\)/)    || [])[1],
        high:         (script.match(/html5player\.setVideoUrlHigh\('(.*?)'\)/)   || [])[1],
        HLS:          (script.match(/html5player\.setVideoHLS\('(.*?)'\)/)       || [])[1],
        thumb:        (script.match(/html5player\.setThumbUrl\('(.*?)'\)/)       || [])[1],
        thumb169:     (script.match(/html5player\.setThumbUrl169\('(.*?)'\)/)    || [])[1],
    }

    const videoUrl = files.high || files.low
    if (!videoUrl) throw new Error('No se encontró URL de descarga en la página.')

    return { title, duration, image, info: parseInfo(info), files, videoUrl }
}

async function xnxxSearch(query) {
    const page = Math.floor(Math.random() * 3) + 1
    const res  = await fetch(`${BASE}/search/${encodeURIComponent(query)}/${page}`, {
        headers: { 'User-Agent': UA }, timeout: 12000
    })
    const $    = cheerio.load(await res.text(), { xmlMode: false })
    const urls = [], titles = [], descs = [], results = []

    $('div.mozaique div.thumb').each((_, el) => {
        const href = $(el).find('a').attr('href')
        if (href) urls.push(BASE + href.replace('/THUMBNUM/', '/'))
    })
    $('div.mozaique div.thumb-under').each((_, el) => {
        descs.push($(el).find('p.metadata').text().trim())
        $(el).find('a').each((_, a) => { titles.push($(a).attr('title') || '') })
    })

    for (let i = 0; i < Math.min(titles.length, urls.length, 10); i++) {
        if (titles[i] && urls[i]) results.push({ title: titles[i], info: descs[i] || '', link: urls[i] })
    }
    return results
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!database.data.groups?.[m.chat]?.nsfw)
        return m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕹𝕾𝕱𝖂 〕══ ✠\n\n` +
            `🔒 Contenido NSFW desactivado en este grupo.\n` +
            `_Un admin puede activarlo con *${usedPrefix}nable nsfw on*_ 🕷️`
        )

    const query = args.join(' ').trim()
    if (!query)
        return m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕹𝕾𝕱𝖂 〕══ ✠\n\n` +
            `⸸ Ingresa un término de búsqueda o link directo.\n` +
            `› *${usedPrefix}${command} milf*\n` +
            `› *${usedPrefix}${command} https://xnxx.com/...*\n\n` +
            `_...no me hagas perder el tiempo._ 🕷️`
        )

    conn.xnxx = conn.xnxx || {}

    if (query.startsWith('http')) {
        if (!query.includes('xnxx.com'))
            return m.reply(`⸸ Solo acepto links de xnxx.com 🕷️`)

        await m.react('⬇️')
        try {
            const { title, duration, info, videoUrl } = await xnxxdl(query)
            const caption =
                `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕹𝕾𝕱𝖂 〕══ ✠\n\n` +
                `🕸️ *${title}*\n` +
                `⏱️ ${duration || 'N/A'}   🎬 ${info.qual || 'N/A'}   👁️ ${info.views || 'N/A'}\n\n` +
                `_${global.dev}_ 🕷️`

            await conn.sendMessage(m.chat, { video: { url: videoUrl }, caption, mimetype: 'video/mp4' }, { quoted: m })
            await m.react('✅')
        } catch (e) {
            await m.react('❌')
            m.reply(`✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕹𝕾𝕱𝖂 〕══ ✠\n\n⸸ Error al descargar.\n\`${e.message.slice(0, 250)}\`\n\n_...intenta con otro link._ 🕷️`)
        }
        return
    }

    await m.react('🔍')
    try {
        const results = await xnxxSearch(query)
        if (!results.length)
            return m.reply(`✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕹𝕾𝕱𝖂 〕══ ✠\n\n⸸ Sin resultados para *${query}*.\n_...busca algo diferente._ 🕷️`)

        const lista = results.map((v, i) =>
            `*${String(i + 1).padStart(2, '0')}.* ${v.title.slice(0, 55)}`
        ).join('\n')

        const { key } = await conn.sendMessage(m.chat, {
            text:
                `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕹𝕾𝕱𝖂 〕══ ✠\n` +
                `🕷️ *${results.length} resultados — "${query}"*\n` +
                `🕸️ ───────────────────\n\n` +
                `${lista}\n\n` +
                `🕸️ ───────────────────\n` +
                `› Responde con el *número* para descargar.\n` +
                `_...tienes 2 minutos._ 🕷️`
        }, { quoted: m })

        clearTimeout(conn.xnxx[m.sender]?.timeout)
        conn.xnxx[m.sender] = {
            result:    results,
            key,
            downloads: 0,
            timeout:   setTimeout(() => delete conn.xnxx[m.sender], 120_000)
        }

        await m.react('🕸️')
    } catch (e) {
        await m.react('❌')
        m.reply(`✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕹𝕾𝕱𝖂 〕══ ✠\n\n⸸ Error en la búsqueda.\n\`${e.message.slice(0, 200)}\`\n\n_...intenta de nuevo._ 🕷️`)
    }
}

handler.before = async (m, { conn }) => {
    conn.xnxx = conn.xnxx || {}
    const session = conn.xnxx[m.sender]
    if (!session || !m.quoted || m.quoted.id !== session.key.id) return

    const n = parseInt(m.text?.trim())
    if (isNaN(n) || n < 1 || n > session.result.length)
        return m.reply(`⸸ Número inválido. Usa del 1 al ${session.result.length} 🕷️`)

    await m.react('⬇️')
    try {
        const video = session.result[n - 1]
        const { title, duration, info, videoUrl } = await xnxxdl(video.link)

        const caption =
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕹𝕾𝕱𝖂 〕══ ✠\n\n` +
            `🕸️ *${title}*\n` +
            `⏱️ ${duration || 'N/A'}   🎬 ${info.qual || 'N/A'}   👁️ ${info.views || 'N/A'}\n\n` +
            `_${global.dev}_ 🕷️`

        await conn.sendMessage(m.chat, { video: { url: videoUrl }, caption, mimetype: 'video/mp4' }, { quoted: m })
        await m.react('✅')

        session.downloads++
        if (session.downloads >= 5) {
            clearTimeout(session.timeout)
            delete conn.xnxx[m.sender]
        }
    } catch (e) {
        await m.react('❌')
        m.reply(`✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕹𝕾𝕱𝖂 〕══ ✠\n\n⸸ Error al descargar.\n\`${e.message.slice(0, 250)}\`\n\n_...intenta con otro número._ 🕷️`)
    }
}

handler.command = ['xnxx', 'xnxxsearch', 'xnxxdl', 'polnito']
handler.tags    = ['nsfw']
handler.help    = ['xnxx <búsqueda o url>']
handler.group   = true

export default handler
