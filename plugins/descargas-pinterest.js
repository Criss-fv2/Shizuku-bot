import axios from 'axios'

global.pinterestOffsets = global.pinterestOffsets || {}

async function searchPinterest(query) {
    const link = `https://id.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}%26rs%3Dtyped&data=%7B%22options%22%3A%7B%22applied_unified_filters%22%3Anull%2C%22appliedProductFilters%22%3A%22---%22%2C%22article%22%3Anull%2C%22auto_correction_disabled%22%3Afalse%2C%22corpus%22%3Anull%2C%22customized_rerank_type%22%3Anull%2C%22domains%22%3Anull%2C%22dynamicPageSizeExpGroup%22%3A%22control%22%2C%22filters%22%3Anull%2C%22journey_depth%22%3Anull%2C%22page_size%22%3Anull%2C%22price_max%22%3Anull%2C%22price_min%22%3Anull%2C%22query_pin_sigs%22%3Anull%2C%22query%22%3A%22${encodeURIComponent(query)}%22%2C%22redux_normalize_feed%22%3Atrue%2C%22request_params%22%3Anull%2C%22rs%22%3A%22typed%22%2C%22scope%22%3A%22pins%22%2C%22selected_one_bar_modules%22%3Anull%2C%22seoDrawerEnabled%22%3Afalse%2C%22source_id%22%3Anull%2C%22source_module_id%22%3Anull%2C%22source_url%22%3A%22%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}%22%2C%22top_pin_id%22%3Anull%2C%22top_pin_ids%22%3Anull%7D%2C%22context%22%3A%7B%7D%7D`
    
    const headers = {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'priority': 'u=1, i',
        'referer': 'https://id.pinterest.com/',
        'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133")',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'x-app-version': 'c056fb7',
        'x-pinterest-appstate': 'active',
        'x-pinterest-pws-handler': 'www/index.js',
        'x-requested-with': 'XMLHttpRequest'
    }

    try {
        const res = await axios.get(link, { headers })
        if (res.data?.resource_response?.data?.results) {
            return res.data.resource_response.data.results.map(item => {
                if (item.images) {
                    return { image_large_url: item.images.orig?.url || null }
                }
                return null
            }).filter(img => img !== null && img.image_large_url !== null)
        }
        return []
    } catch (error) {
        return []
    }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const prefix = usedPrefix || global.prefix || '.'
    const currentCommand = command || 'pinterest'
    const searchQuery = args.join(' ').trim()

    if (!searchQuery) {
        return m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n` +
            `⚠️ *Error de parámetros*\n` +
            `📌 Uso: *${prefix}${currentCommand} <búsqueda>*\n` +
            `💡 Ejemplo: *${prefix}${currentCommand} dark aesthetic*\n\n` +
            `_...ingresa un término válido._ 🕷️`
        )
    }

    await m.react('⏳')

    try {
        let searchResults = await searchPinterest(searchQuery)

        if (!searchResults || searchResults.length === 0) {
            await m.react('❌')
            return m.reply('❌ No encontré resultados para esa búsqueda, darling~')
        }

        // ==========================================
        // 🧠 SISTEMA ANTI-REPETICIÓN INTELIGENTE
        // ==========================================
        const cacheKey = `${m.sender}_${searchQuery.toLowerCase()}`
        
        if (!global.pinterestOffsets[cacheKey]) {
            global.pinterestOffsets[cacheKey] = 0
        }

        searchResults = searchResults.sort(() => 0.5 - Math.random())

        let startIndex = global.pinterestOffsets[cacheKey]
        let endIndex = startIndex + 10

        if (endIndex > searchResults.length) {
            startIndex = 0
            endIndex = 10
            global.pinterestOffsets[cacheKey] = 10
        } else {
            global.pinterestOffsets[cacheKey] = endIndex
        }

        const mediaElements = searchResults.slice(startIndex, endIndex)

        // ==========================================
        // ⚡ ENVÍO EN RÁFAGA (SIN TEXTO)
        // ==========================================
        await Promise.all(mediaElements.map(async (item) => {
            await conn.sendMessage(m.chat, { 
                image: { url: item.image_large_url } 
            })
        }))

        // ==========================================
        // 📜 TEXTO FINAL
        // ==========================================
        const captionText = 
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n` +
            `🌸 *Búsqueda:* ${searchQuery}\n` +
            `⸸ *Resultados enviados:* ${mediaElements.length}\n` +
            `🔄 *Lote:* ${startIndex/10 + 1}\n\n` +
            `_...blinky entregó tu galería con éxito._ 🕷️`

        await conn.sendMessage(m.chat, { text: captionText }, { quoted: m })
        await m.react('✅')

    } catch (error) {
        console.error(error)
        await m.react('❌')
        m.reply(`💔 Error crítico en la infraestructura de envío del sistema.`)
    }
}

handler.help = ['pinterest <búsqueda>']
handler.tags = ['descargas']
handler.command = ['pinterest', 'pin']
handler.register = true

export default handler
