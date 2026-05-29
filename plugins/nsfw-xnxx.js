import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { database } from '../lib/database.js'

global.xnxxCache = global.xnxxCache || {}

const BASE = 'https://www.xnxx.com'
const UA   = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

async function searchXNXX(query) {
    const res  = await fetch(`${BASE}/search/${encodeURIComponent(query)}`, { headers: { 'User-Agent': UA }, timeout: 12000 })
    const $    = cheerio.load(await res.text())
    const results = []

    $('div.mozaique div.thumb-block').each((i, el) => {
        if (i >= 10) return false
        const title = $(el).find('p.metadata a, .thumb-under a').attr('title') || $(el).find('a').attr('title')
        const href  = $(el).find('a').first().attr('href')
        const dur   = $(el).find('span.duration').text().trim() || 'N/A'
        if (title && href) results.push({ title: title.substring(0, 55), link: BASE + href, dur })
    })

    return results
}

async function downloadXNXX(url) {
    const res    = await fetch(url, { headers: { 'User-Agent': UA }, timeout: 15000 })
    const $      = cheerio.load(await res.text())
    const title  = $('meta[property="og:title"]').attr('content') || 'Video'
    const dur    = $('meta[property="og:duration"]').attr('content')
    const script = $('#video-player-bg > script:nth-child(6)').html() || ''
    const high   = (script.match(/html5player\.setVideoUrlHigh\('(.*?)'\)/) || [])[1]
    const low    = (script.match(/html5player\.setVideoUrlLow\('(.*?)'\)/)  || [])[1]
    const videoUrl = high || low
    if (!videoUrl) throw new Error('No se encontró URL del video')
    return { title, dur: dur ? dur + 's' : 'N/A', url: videoUrl }
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!database.data.groups?.[m.chat]?.nsfw)
        return m.reply(`✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n🔒 NSFW desactivado en este grupo.\n_...que lo active un admin primero._ 🕷️`)

    const query = args.join(' ').trim()

    if (!query)
        return m.reply(`✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n⸸ Ingresa un término de búsqueda o un link directo.\n› *${usedPrefix}${command} milf*\n› *${usedPrefix}${command} https://xnxx.com/...*\n\n_...no me hagas perder el tiempo._ 🕷️`)

    if (query.startsWith('http')) {
        if (!query.includes('xnxx.com'))
            return m.reply(`⸸ Solo acepto links de xnxx.com 🕷️`)

        await m.react('⬇️')
        try {
            const { title, dur, url } = await downloadXNXX(query)
            await conn.sendMessage(m.chat, {
                video: { url },
                caption:
                    `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕏𝕟𝕩𝕩 〕══ ✠\n\n` +
                    `🕸️ *${title}*\n` +
                    `⏱️ ${dur}\n\n` +
                    `_${global.dev}_ 🕷️`
            }, { quoted: m })
            await m.react('✅')
        } catch (e) {
            await m.react('❌')
            m.reply(`⸸ Error al descargar.\n\`${e.message.slice(0, 200)}\``)
        }
        return
    }

    await m.react('🔍')

    try {
        const results = await searchXNXX(query)

        if (!results.length)
            return m.reply(`✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕏𝕟𝕩𝕩 〕══ ✠\n\n⸸ Sin resultados para *${query}*.\n_...busca algo menos específico._ 🕷️`)

        const key = `xnxx_${m.sender}_${Date.now()}`
        global.xnxxCache[key] = { results, expiration: Date.now() + 120000 }

        for (const k in global.xnxxCache)
            if (Date.now() > global.xnxxCache[k].expiration) delete global.xnxxCache[k]

        const lista = results.map((v, i) =>
            `*${String(i + 1).padStart(2, '0')}.* ${v.title}\n` +
            `      ⏱️ ${v.dur}`
        ).join('\n\n')

        await conn.sendMessage(m.chat, {
            text:
                `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕏𝕟𝕩𝕩 〕══ ✠\n` +
                `⸸ *${results.length} resultados para:* _${query}_\n` +
                `🕸️ ─────────────────────\n\n` +
                `${lista}\n\n` +
                `🕸️ ─────────────────────\n` +
                `› Responde con *n1* hasta *n${results.length}* para descargar.\n` +
                `_...tienes 2 minutos._ 🕷️\n` +
                `🔑${key}🔑`
        }, { quoted: m })

        await m.react('🕸️')

    } catch (e) {
        console.error('[XNXX SEARCH]', e.message)
        await m.react('❌')
        m.reply(`⸸ Error en la búsqueda.\n\`${e.message.slice(0, 150)}\``)
    }
}

handler.before = async (m, { conn }) => {
    if (!m.quoted?.text) return

    const match = m.quoted.text.match(/🔑(xnxx_[^🔑]+)🔑/)
    if (!match) return

    const key   = match[1].trim()
    const input = m.text?.trim().toLowerCase()
    if (!input?.match(/^n\d{1,2}$/)) return

    const num   = parseInt(input.substring(1))
    if (isNaN(num) || num < 1 || num > 10)
        return m.reply(`⸸ Usa n1 hasta n10 🕷️`)

    const cache = global.xnxxCache[key]
    if (!cache || Date.now() > cache.expiration) {
        if (cache) delete global.xnxxCache[key]
        return m.reply(`✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕏𝕟𝕩𝕩 〕══ ✠\n\n⸸ Sesión expirada. Haz una nueva búsqueda. 🕷️`)
    }

    const video = cache.results[num - 1]
    if (!video) return m.reply(`⸸ Número inválido 🕷️`)

    await m.react('⬇️')

    const aviso = await conn.sendMessage(m.chat, {
        text:
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕏𝕟𝕩𝕩 〕══ ✠\n\n` +
            `⏳ Descargando *n${num}*...\n` +
            `🕸️ _${video.title}_\n\n` +
            `_...un momento._ 🕷️`
    }, { quoted: m })

    try {
        const { title, dur, url } = await downloadXNXX(video.link)

        await conn.sendMessage(m.chat, {
            video: { url },
            caption:
                `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕏𝕟𝕩𝕩 〕══ ✠\n\n` +
                `🕸️ *${title}*\n` +
                `⏱️ ${dur}\n\n` +
                `_${global.dev}_ 🕷️`
        }, { quoted: m })

        await conn.sendMessage(m.chat, {
            text:
                `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕏𝕟𝕩𝕩 〕══ ✠\n\n` +
                `✅ Video *n${num}* enviado.\n` +
                `_${global.dev}_ 🕷️`,
            edit: aviso.key
        })

        await m.react('✅')

    } catch (e) {
        console.error('[XNXX DOWNLOAD]', e.message)
        await m.react('❌')
        await conn.sendMessage(m.chat, {
            text:
                `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕏𝕟𝕩𝕩 〕══ ✠\n\n` +
                `⸸ Error al descargar *n${num}*.\n` +
                `\`${e.message.slice(0, 200)}\`\n\n` +
                `_${global.dev}_ 🕷️`,
            edit: aviso.key
        })
    }
}

handler.command = ['xnxx', 'polnito']
handler.tags    = ['nsfw']
handler.help    = ['xnxx <búsqueda o url>']

export default handler
