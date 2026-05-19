import fetch from 'node-fetch'
import * as cheerio from 'cheerio'

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  if (!global.db.data.chats[msg.chat].nsfw) return msg.react('❌')

  const query = args.join(' ').trim()
  if (!query) {
    await msg.react('🕷️')
    return conn.sendMessage(
      msg.chat,
      { text: `🕸️ *𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝕾𝖞𝖘𝒕𝒆𝒎*\n\nIngresa un enlace directo o un término de búsqueda.\nUso: *${usedPrefix}${command} <texto/url>*` },
      { quoted: msg }
    )
  }

  await msg.react('🕸️')

  try {
    // Modo Descarga Directa
    if (query.includes('xnxx.com')) {
      const res = await extractData(query)
      if (!res || !res.low) throw new Error('Archivo no encontrado.')

      return conn.sendMessage(
        msg.chat,
        {
          video: { url: res.low },
          caption: `🖤 *CONTENIDO OBTENIDO*\n🕷️ *Título:* ${res.title}`,
          mimetype: 'video/mp4'
        },
        { quoted: msg }
      ).then(() => msg.react('🖤'))
    }

    // Modo Búsqueda
    const data = await scrapeSearch(query)
    if (!data.length) {
      await msg.react('❌')
      return conn.sendMessage(msg.chat, { text: `🖤 Sin resultados en la red.` }, { quoted: msg })
    }

    // Guardar resultados en la caché temporal del usuario
    conn.xnxxCache = conn.xnxxCache || {}
    conn.xnxxCache[msg.sender] = data

    let text = `🖤 *𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝕾𝖞𝖘𝒕𝒆𝒎* 🖤\n\n`
    data.slice(0, 10).forEach((v, i) => {
      text += `*${i + 1}.* ${v.title}\n👁‍🗨 ${v.views} | ⏱️ ${v.dur} | 📅 ${v.date}\n\n`
    })
    text += `🕷️ *Responde a este mensaje con un número del 1 al 10 para descargar.*`

    await conn.sendMessage(msg.chat, { text: text.trim() }, { quoted: msg })

  } catch (e) {
    console.error(e)
    await msg.react('❌')
  }
}

// Interceptor para descargar al responder con un número
handler.before = async (msg, { conn }) => {
  conn.xnxxCache = conn.xnxxCache || {}
  if (!msg.quoted || !msg.text) return
  if (!msg.quoted.text.includes('🖤 *𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝕾𝖞𝖘𝒕𝒆𝒎* 🖤')) return

  const num = parseInt(msg.text.trim())
  if (isNaN(num) || num < 1 || num > 10) return

  const cache = conn.xnxxCache[msg.sender]
  if (!cache || !cache[num - 1]) return

  await msg.react('🕸️')
  
  try {
    const url = cache[num - 1].link
    const res = await extractData(url)
    
    if (!res || !res.low) throw new Error('Error de extracción.')

    await conn.sendMessage(
      msg.chat,
      {
        video: { url: res.low },
        caption: `🖤 *CONTENIDO OBTENIDO*\n🕷️ *Título:* ${res.title}`,
        mimetype: 'video/mp4'
      },
      { quoted: msg }
    )
    
    await msg.react('🖤')
    delete conn.xnxxCache[msg.sender] // Limpiar caché tras descargar
  } catch (e) {
    console.error(e)
    await msg.react('❌')
  }
}

async function scrapeSearch(query) {
  const res = await fetch(`https://www.xnxx.com/search/${encodeURIComponent(query)}`)
  const html = await res.text()
  const $ = cheerio.load(html)
  const results = []

  $('div.mozaique div.thumb-block').each((i, el) => {
    const link = $(el).find('div.thumb-under p.metadata a').attr('href') || $(el).find('a').attr('href')
    if (!link) return
    
    const title = $(el).find('div.thumb-under p.metadata a').attr('title') || $(el).find('div.thumb-under a').attr('title') || 'Desconocido'
    const meta = $(el).find('div.thumb-under p.metadata').text().replace(/\s+/g, ' ').trim()
    
    const views = meta.match(/(\d+[kKmM]?\sViews)/i)?.[0] || 'N/A'
    const dur = meta.match(/(\d+\smin)/i)?.[0] || 'N/A'
    const date = meta.match(/(\d+\s(days|months|years)\sago)/i)?.[0] || 'N/A'

    results.push({ title, link: 'https://www.xnxx.com' + link, views, dur, date })
  })
  
  return results
}

async function extractData(URL) {
  const res = await fetch(URL)
  const html = await res.text()
  const $ = cheerio.load(html)
  
  const title = $('meta[property="og:title"]').attr('content') || 'Sin título'
  const script = $('script').filter((i, el) => $(el).html()?.includes('html5player')).html() || ''
  
  // Extrae el archivo en baja calidad (360p)
  const lowMatch = script.match(/html5player\.setVideoUrlLow\('(.*?)'\)/)
  return { title, low: lowMatch ? lowMatch[1] : null }
}

handler.help = ['xnxx']
handler.tags = ['nsfw']
handler.command = ['xnxx']
handler.nsfw = true

export default handler
