import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { database } from '../lib/database.js'

global.phCache = global.phCache || {}

const PH_API = 'https://api.alyacore.xyz/nsfw/dl/pornhub'
const PH_KEY = 'Alya-t42f4M8X'

// ══════════════════════════════════════════
// 🕷 BÚSQUEDA EN PORNHUB
// ══════════════════════════════════════════
async function searchPornhub(query) {
    const url = `https://www.pornhub.com/video/search?search=${encodeURIComponent(query)}`
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cookie': 'platform=pc; age_verified=1; ss=1'
        },
        timeout: 12000
    })

    const html = await res.text()
    const $ = cheerio.load(html)
    const results = []

    $('.pcVideoListItem').each((i, el) => {
        if (i >= 10) return false
        try {
            const title = $(el).find('.title a').text().trim() ||
                          $(el).find('a[title]').attr('title') || 'Sin título'

            const href = $(el).find('.title a').attr('href') ||
                         $(el).find('a[href*="viewkey"]').first().attr('href')
            if (!href) return

            const link = href.startsWith('http') ? href : 'https://www.pornhub.com' + href

            const dur = $(el).find('.videoDuration').text().trim() ||
                        $(el).find('.duration').text().trim() || 'N/A'

            const views = $(el).find('.views var').text().trim() ||
                          $(el).find('.videoViews').text().trim() || 'N/A'

            const rating = $(el).find('.value').text().trim() || 'N/A'

            results.push({
                title: title.substring(0, 55),
                link,
                dur,
                views,
                rating
            })
        } catch {}
    })

    return results
}

// ══════════════════════════════════════════
// 🕷 DESCARGA VÍA TU API
// ══════════════════════════════════════════
async function downloadPH(url) {
    const apiUrl = `${PH_API}?url=${encodeURIComponent(url)}&key=${PH_KEY}`
    const res = await fetch(apiUrl, { timeout: 20000 })
    const data = await res.json()

    if (!data?.status) {
        throw new Error(data?.message || 'La API no pudo procesar este video')
    }

    // Intentar diferentes campos que podría devolver la API
    const videoUrl = data?.result?.download ||
                     data?.result?.url ||
                     data?.result?.video ||
                     data?.result?.low ||
                     data?.result?.high ||
                     data?.download ||
                     data?.url ||
                     data?.video

    const title = data?.result?.title || data?.title || 'Video'

    if (!videoUrl) throw new Error(`La API no devolvió URL del video`)

    return { url: videoUrl, title }
}

// ══════════════════════════════════════════
// 🕷 HANDLER PRINCIPAL
// ══════════════════════════════════════════
const handler = async (msg, { conn, args, usedPrefix, command }) => {
    if (!database.data.groups?.[msg.chat]?.nsfw) {
        return msg.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 NSFW desactivado en este grupo\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
        )
    }

    const query = args.join(' ').trim()

    if (!query) return msg.reply(
        `🕷 *${global.botTag}*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `🕸 Ingresa un término o URL de Pornhub\n` +
        `🕷 Búsqueda: *${usedPrefix}${command} milf*\n` +
        `🕸 URL directa: *${usedPrefix}${command} https://pornhub.com/...*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `${global.author}`
    )

    // ── Modo URL directa ──
    if (query.startsWith('http')) {
        if (!query.includes('pornhub.com')) {
            return msg.reply(
                `🕷 *${global.botTag}*\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `🕸 Solo se aceptan URLs de Pornhub\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `${global.author}`
            )
        }

        await msg.react('📥')
        try {
            const { url, title } = await downloadPH(query)
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
        const data = await searchPornhub(query)

        if (!data.length) return msg.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 Sin resultados para *${query}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
        )

        const cacheKey = `ph_${msg.sender}_${Date.now()}`
        global.phCache[cacheKey] = { data, expiration: Date.now() + 300000 }

        // Limpiar cachés expirados
        for (const k in global.phCache) {
            if (Date.now() > global.phCache[k].expiration) delete global.phCache[k]
        }

        let menu =
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 *Resultados:* ${query}\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n\n`

        data.forEach((v, i) => {
            menu += `*${i + 1}.* ${v.title}\n`
            menu += `🕷 ⏱ ${v.dur}  👁 ${v.views}  ⭐ ${v.rating}\n\n`
        })

        menu +=
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 *Responde con n1 hasta n${data.length}*\n` +
            `🕷 Válido por 5 minutos\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}\n` +
            `🔑${cacheKey}🔑`

        await conn.sendMessage(msg.chat, { text: menu }, { quoted: msg })
        await msg.react('🕸')

    } catch (e) {
        console.error('PH SEARCH ERROR:', e.message)
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
// 🕷 CAPTURA SELECCIÓN n1-n10
// ══════════════════════════════════════════
handler.before = async (msg, { conn }) => {
    if (!msg.quoted?.text) return

    // Detectar cacheKey entre 🔑
    const match = msg.quoted.text.match(/🔑(ph_[^🔑]+)🔑/)
    if (!match) return

    const cacheKey = match[1].trim()

    // Detectar n1-n10
    const input = msg.text?.trim().toLowerCase()
    if (!input?.match(/^n\d{1,2}$/)) return

    const num = parseInt(input.substring(1))
    if (isNaN(num) || num < 1 || num > 10) {
        return msg.reply(`🕷 Usa n1 hasta n10`)
    }

    const cache = global.phCache[cacheKey]
    if (!cache) return msg.reply(
        `🕷 *${global.botTag}*\n🕸 Lista expirada, haz una nueva búsqueda\n${global.author}`
    )

    if (Date.now() > cache.expiration) {
        delete global.phCache[cacheKey]
        return msg.reply(
            `🕷 *${global.botTag}*\n🕸 Sesión expirada, haz una nueva búsqueda\n${global.author}`
        )
    }

    const video = cache.data[num - 1]
    if (!video) return msg.reply(`🕷 Número inválido`)

    await msg.react('📥')

    // Aviso inmediato de que está procesando
    const aviso = await conn.sendMessage(msg.chat, {
        text:
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 Descargando video *n${num}*...\n` +
            `🕷 ${video.title}\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
    }, { quoted: msg })

    try {
        const { url, title } = await downloadPH(video.link)

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

        // Editar aviso a completado
        await conn.sendMessage(msg.chat, {
            text:
                `🕷 *${global.botTag}*\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `🕸 Video *n${num}* enviado ✅\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `${global.author}`,
            edit: aviso.key
        })

        await msg.react('✅')

    } catch (e) {
        console.error('PH DOWNLOAD ERROR:', e.message)
        await msg.react('❌')
        await conn.sendMessage(msg.chat, {
            text:
                `🕷 *${global.botTag}*\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `🕸 Error al descargar n${num}\n` +
                `\`${e.message.slice(0, 200)}\`\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `${global.author}`,
            edit: aviso.key
        })
    }
}

handler.command = ['xnxx', 'ph', 'pornhub']
handler.tags = ['nsfw']
handler.help = ['xnxx <búsqueda o url pornhub>']

export default handler
