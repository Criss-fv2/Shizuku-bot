import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { database } from '../lib/database.js'

// Variable global para almacenar búsquedas
global.xnxxCache = global.xnxxCache || {}

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

        // 🔑 Guardar en global en lugar de conn
        const cacheKey = `xnxx_${msg.sender}_${Date.now()}`
        global.xnxxCache[cacheKey] = { data, expiration: Date.now() + 300000 } // 5 minutos

        let menu = `🖤 *𝑺𝒉𝒊𝒛𝒖𝒌𝒖 𝕾𝖞𝖘𝒕𝒆𝒎 - Resultados XNXX* 🖤\n\n`
        
        data.forEach((v, i) => {
            menu += `*${i + 1}.* ${v.title}\n`
            menu += `   👁️: ${v.views || '?'} | ⏱️: ${v.dur || '?'} | 📅: ${v.date || '?'}\n\n`
        })
        
        menu += `━━━━━━━━━━━━━━━━━━\n`
        menu += `🕷️ *Responde con: n1, n2, n3... hasta n${data.length}*\n`
        menu += `📌 Ejemplo: n7\n`
        menu += `⏰ Válido por 5 minutos\n\n`
        menu += `${cacheKey}` // Usar cacheKey como identificador

        const sent = await conn.sendMessage(msg.chat, { text: menu }, { quoted: msg })
        
    } catch (e) {
        console.error('XNXX ERROR:', e.message)
        msg.react('❌')
        msg.reply('❌ Error en la búsqueda. Intenta con otro término.')
    }
}

handler.before = async (msg, { conn }) => {
    // 🔑 AQUÍ ES DONDE FALLA: Revisar si respondió a nuestro mensaje
    if (!msg.quoted || !msg.quoted.text) return
    
    // Buscar la cacheKey en el texto citado
    let cacheKey = null
    const lines = msg.quoted.text.split('\n')
    for (const line of lines) {
        if (line.includes('xnxx_')) {
            cacheKey = line.trim()
            break
        }
    }
    
    if (!cacheKey) return // No es respuesta a nuestro mensaje

    const input = msg.text.trim().toLowerCase()
    if (!input.startsWith('n')) return // Debe empezar con 'n'

    const num = parseInt(input.substring(1))
    if (isNaN(num) || num < 1 || num > 10) {
        return msg.reply('❌ Usa n1, n2, n3... hasta n10')
    }

    // 🔑 Obtener caché
    const cache = global.xnxxCache[cacheKey]
    if (!cache) return msg.reply('❌ Error: La lista expiró. Haz una nueva búsqueda.')
    
    // 🔑 Verificar expiración
    if (Date.now() > cache.expiration) {
        delete global.xnxxCache[cacheKey]
        return msg.reply('⏰ La sesión expiró. Haz una nueva búsqueda.')
    }

    const video = cache.data[num - 1]
    if (!video) return msg.reply('❌ Número inválido.')

    await msg.react('📥')
    
    try {
        console.log(`Extrayendo video de: ${video.link}`)
        const videoData = await extractData(video.link)
        
        if (!videoData.low || videoData.low.trim() === '') {
            throw new Error('No se pudo extraer URL del video')
        }

        await conn.sendMessage(msg.chat, {
            video: { url: videoData.low },
            caption: `🖤 *Video descargado*\n\n📝 ${video.title}\n⏱️ ${video.dur || '?'}\n👁️ ${video.views || '?'}`
        }, { quoted: msg })
        
        await msg.react('✅')
        
    } catch (e) {
        console.error('DESCARGA ERROR:', e.message)
        await msg.react('❌')
        msg.reply(`❌ Error descargando video:\n${e.message}`)
    }
}

async function scrapeSearch(query) {
    try {
        const res = await fetch(`https://www.xnxx.com/search/${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
        
        const html = await res.text()
        const $ = cheerio.load(html)
        const results = []

        // 🔑 MEJOR SELECTOR: Buscar todos los divs con clase "thumb"
        $('.mozaique .thumb-block').each((i, el) => {
            if (i >= 10) return false

            try {
                // Extracción del título
                const title = $(el).find('a.thumb').attr('title') || 
                             $(el).find('.thumb-under a').attr('title') || 
                             'Sin título'

                // Extracción del enlace
                const href = $(el).find('a.thumb').attr('href') || 
                            $(el).find('.thumb-under a').attr('href')
                const link = href ? ('https://www.xnxx.com' + href) : null

                if (!link) return // Skip si no hay link

                // 🔑 MEJOR: Buscar todos los elementos de metadata
                const metadata = $(el).find('.metadata span').text() || $(el).find('.metadata').text() || ''
                
                // Extraer views
                const viewsMatch = metadata.match(/(\d+(?:[.,]\d+)?[KM]?)\s*(?:Views?|views?)/i)
                const views = viewsMatch ? viewsMatch[1] : 'N/A'

                // Extraer duración
                const durMatch = metadata.match(/(\d+)\s*(?:min|minutes?)/i)
                const dur = durMatch ? `${durMatch[1]} min` : 'N/A'

                // Extraer fecha
                const dateMatch = metadata.match(/(\d+\s(?:days?|months?|years?|hours?|week|weeks)\s(?:ago|atrás))/i)
                const date = dateMatch ? dateMatch[1] : 'Recientemente'

                results.push({ 
                    title: title.substring(0, 60), // Limitar caracteres
                    link, 
                    views, 
                    dur, 
                    date 
                })
            } catch (innerError) {
                console.error('Error en iteración:', innerError.message)
            }
        })

        return results
    } catch (e) {
        console.error('SCRAPE ERROR:', e.message)
        return []
    }
}

async function extractData(url) {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
        
        const html = await res.text()

        // 🔑 Intentar múltiples patrones (el sitio puede variar)
        let videoUrl = null

        // Patrón 1: setVideoUrlLow
        const pattern1 = html.match(/html5player\.setVideoUrlLow\('([^']+)'\)/)
        if (pattern1) {
            videoUrl = pattern1[1]
            console.log('✅ Video encontrado (patrón 1)')
        }

        // Patrón 2: setVideoHLS
        if (!videoUrl) {
            const pattern2 = html.match(/html5player\.setVideoHLS\('([^']+)'\)/)
            if (pattern2) {
                videoUrl = pattern2[1]
                console.log('✅ Video encontrado (patrón 2)')
            }
        }

        // Patrón 3: "video_url":"..."
        if (!videoUrl) {
            const pattern3 = html.match(/"video_url":"([^"]+)"/)
            if (pattern3) {
                videoUrl = pattern3[1].replace(/\\/g, '')
                console.log('✅ Video encontrado (patrón 3)')
            }
        }

        // Patrón 4: mp4 en script
        if (!videoUrl) {
            const pattern4 = html.match(/src=["']([^"']*\.mp4[^"']*)["']/)
            if (pattern4) {
                videoUrl = pattern4[1]
                console.log('✅ Video encontrado (patrón 4)')
            }
        }

        if (!videoUrl) {
            console.warn('⚠️ No se encontró video en la página')
            throw new Error('No se pudo extraer la URL del video. El sitio puede haber cambiado.')
        }

        return {
            title: 'Video Descargado',
            low: videoUrl
        }

    } catch (e) {
        console.error('EXTRACT ERROR:', e.message)
        throw e
    }
}

handler.command = ['xnxx']
handler.tags = ['nsfw']
handler.help = ['xnxx <búsqueda>']

export default handler
