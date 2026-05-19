import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { database } from '../lib/database.js'

const handler = async (msg, { conn, args, usedPrefix, command }) => {
    if (!database.data.groups?.[msg.chat]?.nsfw) {
        return msg.reply('🚫 El contenido NSFW está desactivado en este grupo.')
    }

    const query = args.join(' ').trim()
    if (!query) return msg.reply(`🕷️ *Uso:* ${usedPrefix}${command} <búsqueda/url>`)

    await msg.react('🔍')

    try {
        if (query.includes('xnxx.com')) {
            const res = await extractData(query)
            return conn.sendMessage(msg.chat, { video: { url: res.low }, caption: `🖤 *Descargando:* ${res.title}` }, { quoted: msg })
        }

        const data = await scrapeSearch(query)
        if (!data.length) return msg.reply('❌ No encontré resultados.')

        // Guardamos en la sesión
        conn.xnxxCache = conn.xnxxCache || {}
        conn.xnxxCache[msg.sender] = data

        let menu = `🖤 *𝑺𝒉𝒊𝒛𝒖𝒌𝒖 𝕾𝖞𝖘𝒕𝖊𝒎 - Resultados* 🖤\n\n`
        data.slice(0, 10).forEach((v, i) => {
            menu += `*${i + 1}.* ${v.title}\n`
            menu += `   👁‍🗨: ${v.views} | ⏱️: ${v.dur} | 📅: ${v.date}\n\n`
        })
        menu += `🕷️ *Responde a este mensaje con un número (1-10) para descargar.*`

        let sent = await conn.sendMessage(msg.chat, { text: menu }, { quoted: msg })
        
        // Guardamos el ID del mensaje para validarlo luego
        conn.xnxxCache[msg.sender + '_id'] = sent.key.id
    } catch (e) {
        console.error(e)
        msg.reply('❌ Error al buscar.')
    }
}

handler.before = async (msg, { conn }) => {
    conn.xnxxCache = conn.xnxxCache || {}
    
    // Verificamos si es una respuesta a nuestro mensaje
    if (!msg.quoted || !msg.quoted.id || !conn.xnxxCache[msg.sender + '_id']) return
    if (msg.quoted.id !== conn.xnxxCache[msg.sender + '_id']) return

    const num = parseInt(msg.text.trim())
    if (isNaN(num) || num < 1 || num > 10) return

    const data = conn.xnxxCache[msg.sender]
    if (!data || !data[num - 1]) return

    await msg.react('📥')
    try {
        const video = await extractData(data[num - 1].link)
        await conn.sendMessage(msg.chat, { 
            video: { url: video.low }, 
            caption: `🖤 *Shizuku ha finalizado la descarga*\nTítulo: ${video.title}` 
        }, { quoted: msg })
        
        delete conn.xnxxCache[msg.sender]
        delete conn.xnxxCache[msg.sender + '_id']
    } catch (e) {
        msg.reply('❌ Fallo al extraer el video.')
    }
}

async function scrapeSearch(query) {
    const res = await fetch(`https://www.xnxx.com/search/${encodeURIComponent(query)}`)
    const html = await res.text()
    const $ = cheerio.load(html)
    const results = []

    $('.mozaique .thumb-block').each((i, el) => {
        const title = $(el).find('.thumb-under a').attr('title') || 'Sin título'
        const link = 'https://www.xnxx.com' + $(el).find('.thumb-under a').attr('href')
        const metadata = $(el).find('.metadata').text()
        
        // Extracción refinada
        const views = metadata.match(/(\d+[KMG]?\sviews)/i)?.[0] || 'N/A'
        const dur = metadata.match(/(\d+\smin)/i)?.[0] || 'N/A'
        const date = metadata.match(/(\d+\s(days|months|years)\sago)/i)?.[0] || 'N/A'

        if (i < 10) results.push({ title, link, views, dur, date })
    })
    return results
}

async function extractData(url) {
    const res = await fetch(url)
    const html = await res.text()
    const $ = cheerio.load(html)
    const script = $('script').html() || ''
    const lowMatch = script.match(/html5player\.setVideoUrlLow\('(.*?)'\)/)
    return { title: $('title').text(), low: lowMatch ? lowMatch[1] : '' }
}

handler.command = ['xnxx']
export default handler
