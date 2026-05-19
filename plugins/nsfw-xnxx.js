import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { database } from '../lib/database.js'

const handler = async (msg, { conn, args, usedPrefix, command }) => {
    if (!database.data.groups?.[msg.chat]?.nsfw) {
        return msg.reply('🚫 El contenido NSFW está desactivado.')
    }

    const query = args.join(' ').trim()
    if (!query) return msg.reply(`🕷️ *Uso:* ${usedPrefix}${command} <búsqueda>`)

    await msg.react('🔍')

    try {
        const data = await scrapeSearch(query)
        if (!data.length) return msg.reply('❌ No se encontraron resultados.')

        // Guardar caché en memoria con el ID del chat
        conn.xnxxCache = conn.xnxxCache || {}
        conn.xnxxCache[msg.chat] = data

        let menu = `🖤 *𝑺𝒉𝒊𝒛𝒖𝒌𝒖 𝕾𝖞𝖘𝒕𝖊𝒎 - Resultados* 🖤\n\n`
        data.forEach((v, i) => {
            menu += `*${i + 1}.* ${v.title}\n`
            menu += `   👁‍🗨: ${v.views} | ⏱️: ${v.dur} | 📅: ${v.date}\n\n`
        })
        menu += `🕷️ *Responde a este mensaje con "n" + el número (ejemplo: n7) para descargar.*\n\n`
        menu += `_#SESS:XNXX_` // Etiqueta invisible de detección

        let sent = await conn.sendMessage(msg.chat, { text: menu }, { quoted: msg })
    } catch (e) {
        console.error(e)
        msg.react('❌')
    }
}

handler.before = async (msg, { conn }) => {
    // Solo procesar si es una respuesta a un mensaje que contiene nuestra etiqueta
    if (!msg.quoted || !msg.quoted.text || !msg.quoted.text.includes('_#SESS:XNXX_')) return
    
    const input = msg.text.trim().toLowerCase()
    if (!input.startsWith('n')) return // Debe empezar con 'n'

    const num = parseInt(input.replace('n', ''))
    if (isNaN(num) || num < 1 || num > 10) return

    const cache = conn.xnxxCache[msg.chat]
    if (!cache || !cache[num - 1]) return msg.reply('❌ Error: La lista expiró.')

    await msg.react('📥')
    
    try {
        const video = await extractData(cache[num - 1].link)
        await conn.sendMessage(msg.chat, { 
            video: { url: video.low }, 
            caption: `🖤 *Descarga completada*\nTítulo: ${video.title}` 
        }, { quoted: msg })
        
        await msg.react('🖤')
    } catch (e) {
        msg.reply('❌ Fallo al extraer el archivo.')
        await msg.react('❌')
    }
}

async function scrapeSearch(query) {
    const res = await fetch(`https://www.xnxx.com/search/${encodeURIComponent(query)}`)
    const html = await res.text()
    const $ = cheerio.load(html)
    const results = []

    $('.mozaique .thumb-block').each((i, el) => {
        if (i >= 10) return
        const title = $(el).find('.thumb-under a').attr('title') || 'Sin título'
        const link = 'https://www.xnxx.com' + $(el).find('.thumb-under a').attr('href')
        const metaText = $(el).find('.metadata').text()
        
        // Extracción de datos
        const views = metaText.match(/(\d+[MK]?\s[Vv]iews)/)?.[0] || 'N/A'
        const dur = metaText.match(/(\d+\smin)/)?.[0] || 'N/A'
        const date = metaText.match(/(\d+\s(days|months|years)\sago)/)?.[0] || 'N/A'

        results.push({ title, link, views, dur, date })
    })
    return results
}

async function extractData(url) {
    const res = await fetch(url)
    const html = await res.text()
    const script = html.match(/html5player\.setVideoUrlLow\('(.*?)'\)/)
    return { title: 'Video Descargado', low: script ? script[1] : '' }
}

handler.command = ['xnxx']
export default handler
