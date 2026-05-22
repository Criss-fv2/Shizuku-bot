import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { database } from '../lib/database.js'

global.xnxxCache = global.xnxxCache || {}

const PORNHUB_API = 'https://api.alyacore.xyz/nsfw/dl/pornhub'
const PORNHUB_KEY = 'Alya-t42f4M8X'

// ══════════════════════════════════════════
// 🕷 SCRAPING XNXX
// ══════════════════════════════════════════
async function scrapeSearch(query) {
    const url = `https://www.xnxx.com/search/${encodeURIComponent(query)}`
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Referer': 'https://www.xnxx.com/'
        },
        timeout: 10000
    })

    const html = await res.text()
    const $ = cheerio.load(html)
    const results = []

    $('.mozaique .thumb-block').each((i, el) => {
        if (i >= 10) return false
        try {
            const title = $(el).find('a[title]').first().attr('title') ||
                          $(el).find('p.title a').text().trim() ||
                          'Sin título'

            const href = $(el).find('a').first().attr('href')
            if (!href || !href.includes('/video')) return

            const link = 'https://www.xnxx.com' + href

            // Duración — suele estar en .metadata o span con formato 00:00
            const metaText = $(el).find('.metadata').text() ||
                             $(el).find('.thumb-under').text() || ''

            const durMatch = metaText.match(/(\d{1,2}:\d{2}(?::\d{2})?)/) ||
                             metaText.match(/(\d+)\s*min/i)
            const dur = durMatch ? durMatch[1] : 'N/A'

            const viewsMatch = metaText.match(/([\d,.]+[KkMm]?)\s*(?:views?|vistas?)/i)
            const views = viewsMatch ? viewsMatch[1] : 'N/A'

            const dateMatch = metaText.match(/(\d+\s(?:days?|months?|years?|hours?|weeks?)\s(?:ago|atrás))/i)
            const date = dateMatch ? dateMatch[1] : 'Reciente'

            results.push({
                title: title.trim().substring(0, 55),
                link,
                dur,
                views,
                date
            })
        } catch {}
    })

    return results
}

// ══════════════════════════════════════════
// 🕷 DESCARGA VÍA API PORNHUB
// ══════════════════════════════════════════
async function downloadVideo(url) {
    const apiUrl = `${PORNHUB_API}?url=${encodeURIComponent(url)}&key=${PORNHUB_KEY}`
    const res = await fetch(apiUrl, { timeout: 15000 })
    const data = await res.json()

    // Intentar diferentes campos según lo que devuelva la API
    const videoUrl = data?.result?.download_url ||
                     data?.result?.url ||
                     data?.download_url ||
                     data?.url ||
                     data?.link ||
                     data?.data?.url ||
                     data?.data?.download_url

    if (!videoUrl) throw new Error(`API no devolvió URL de descarga.\nRespuesta: ${JSON.stringify(data).slice(0, 200)}`)
    return { url: videoUrl, title: data?.result?.title || data?.title || 'Video' }
}

// ══════════════════════════════════════════
// 🕷 HANDLER PRINCIPAL
// ══════════════════════════════════════════
const handler = async (msg, { conn, args, usedPrefix, command }) => {
    if (!database.data.groups?.[msg.chat]?.nsfw) {
        return msg.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 El contenido NSFW está desactivado en este grupo\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
        )
    }

    const query = args.join(' ').trim()

    if (!query) return msg.reply(
        `🕷 *${global.botTag}*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `🕸 Ingresa un término de búsqueda o URL\n` +
        `🕷 Búsqueda: *${usedPrefix}${command} milf*\n` +
        `🕸 URL directa: *${usedPrefix}${command} https://...*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `${global.author}`
    )

    // ── Modo URL directa ──
    if (query.startsWith('http')) {
        await msg.react('📥')
        try {
            const { url, title } = await downloadVideo(query)
            await conn.sendMessage(msg.chat, {
                video: { url },
                caption:
                    `🕷 *${global.botTag}*\n` +
                    `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                    `🕸 *${title}*\n` +
                    `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                    `${global.author}`
            }, { quoted: msg })
            await msg.react('✅')
        } catch (e) {
            await msg.react('❌')
            msg.reply(
                `🕷 *${global.botTag}*\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `🕸 Error al descargar\n` +
                `\`${e.message.slice(0, 200)}\`\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `${global.author}`
            )
        }
        return
    }

    // ── Modo búsqueda ──
    await msg.react('🔍')

    try {
        const data = await scrapeSearch(query)
        if (!data.length) return msg.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 No se encontraron resultados para *${query}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
        )

        const cacheKey = `xnxx_${msg.sender}_${Date.now()}`
        global.xnxxCache[cacheKey] = { data, expiration: Date.now() + 300000 }

        // Limpiar cachés viejos
        for (const k in global.xnxxCache) {
            if (Date.now() > global.xnxxCache[k].expiration) delete global.xnxxCache[k]
        }

        let menu =
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 *Resultados para:* ${query}\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n\n`

        data.forEach((v, i) => {
            menu += `*${i + 1}.* ${v.title}\n`
            menu += `🕷 ⏱ ${v.dur}  👁 ${v.views}  📅 ${v.date}\n\n`
        })

        menu +=
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 Responde con *n1* hasta *n${data.length}* para descargar\n` +
            `🕷 Ejemplo: *n3*  ·  Válido 5 minutos\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}\n` +
            `[${cacheKey}]`

        await conn.sendMessage(msg.chat, { text: menu }, { quoted: msg })
        await msg.react('🕸')

    } catch (e) {
        console.error('XNXX ERROR:', e.message)
        await msg.react('❌')
        msg.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 Error en la búsqueda\n` +
            `\`${e.message.slice(0, 150)}\`\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
        )
    }
}

// ══════════════════════════════════════════
// 🕷 HANDLER.BEFORE — Captura la selección
// ══════════════════════════════════════════
handler.before = async (msg, { conn }) => {
    if (!msg.quoted?.text) return

    // Extraer cacheKey del mensaje citado
    const match = msg.quoted.text.match(/\[xnxx_[^\]]+\]/)
    if (!match) return

    const cacheKey = match[0].replace(/[\[\]]/g, '')
    const input = msg.text?.trim().toLowerCase()
    if (!input?.startsWith('n')) return

    const num = parseInt(input.substring(1))
    if (isNaN(num) || num < 1 || num > 10) return msg.reply('🕷 Usa n1, n2... hasta n10')

    const cache = global.xnxxCache[cacheKey]
    if (!cache) return msg.reply(
        `🕷 *${global.botTag}*\n🕸 La lista expiró, haz una nueva búsqueda\n${global.author}`
    )

    if (Date.now() > cache.expiration) {
        delete global.xnxxCache[cacheKey]
        return msg.reply(
            `🕷 *${global.botTag}*\n🕸 Sesión expirada, haz una nueva búsqueda\n${global.author}`
        )
    }

    const video = cache.data[num - 1]
    if (!video) return msg.reply('🕷 Número inválido')

    await msg.react('📥')

    try {
        const { url, title } = await downloadVideo(video.link)

        await conn.sendMessage(msg.chat, {
            video: { url },
            caption:
                `🕷 *${global.botTag}*\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `🕸 *${video.title}*\n` +
                `🕷 ⏱ ${video.dur}  👁 ${video.views}\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `${global.author}`
        }, { quoted: msg })

        await msg.react('✅')

    } catch (e) {
        console.error('DESCARGA ERROR:', e.message)
        await msg.react('❌')
        msg.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 Error al descargar el video\n` +
            `\`${e.message.slice(0, 200)}\`\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
        )
    }
}

handler.command = ['xnxx']
handler.tags = ['nsfw']
handler.help = ['xnxx <búsqueda o url>']

export default handler
