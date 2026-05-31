import axios from 'axios'

const HEADER = () => `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠`
const BATCH  = 13
const POOL   = 60

const _seen = new Map()

function pickFresh(images, key) {
    if (!_seen.has(key)) _seen.set(key, new Set())
    const seen = _seen.get(key)
    if (seen.size >= images.length) seen.clear()

    const pool = images.map((_, i) => i).filter(i => !seen.has(i))
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]]
    }

    const chosen = pool.slice(0, BATCH)
    for (const i of chosen) seen.add(i)
    return chosen.map(i => images[i])
}

async function searchPinterest(query) {
    const url = `https://id.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}%26rs%3Dtyped&data=%7B%22options%22%3A%7B%22applied_unified_filters%22%3Anull%2C%22appliedProductFilters%22%3A%22---%22%2C%22article%22%3Anull%2C%22auto_correction_disabled%22%3Afalse%2C%22corpus%22%3Anull%2C%22customized_rerank_type%22%3Anull%2C%22domains%22%3Anull%2C%22dynamicPageSizeExpGroup%22%3A%22control%22%2C%22filters%22%3Anull%2C%22journey_depth%22%3Anull%2C%22page_size%22%3Anull%2C%22price_max%22%3Anull%2C%22price_min%22%3Anull%2C%22query_pin_sigs%22%3Anull%2C%22query%22%3A%22${encodeURIComponent(query)}%22%2C%22redux_normalize_feed%22%3Atrue%2C%22request_params%22%3Anull%2C%22rs%22%3A%22typed%22%2C%22scope%22%3A%22pins%22%2C%22selected_one_bar_modules%22%3Anull%2C%22seoDrawerEnabled%22%3Afalse%2C%22source_id%22%3Anull%2C%22source_module_id%22%3Anull%2C%22source_url%22%3A%22%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}%22%2C%22top_pin_id%22%3Anull%2C%22top_pin_ids%22%3Anull%7D%2C%22context%22%3A%7B%7D%7D`

    const { data } = await axios.get(url, {
        timeout: 15000,
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
            'accept': 'application/json, text/javascript, */*; q=0.01',
            'referer': 'https://id.pinterest.com/',
            'x-requested-with': 'XMLHttpRequest',
            'x-pinterest-appstate': 'active'
        }
    })

    const results = data?.resource_response?.data?.results || []
    return results
        .map(item => item?.images?.orig?.url || item?.images?.['736x']?.url || null)
        .filter(Boolean)
        .slice(0, POOL)
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const query = args.join(' ').trim()

    if (!query) return m.reply(
        `${HEADER()}\n\n` +
        `⚠️ *Sin parámetros*\n` +
        `📌 Uso: *${usedPrefix}${command} <búsqueda>*\n` +
        `💡 Ejemplo: *${usedPrefix}${command} dark aesthetic*\n\n` +
        `_...ingresa un término válido._ 🕷️`
    )

    await m.react('⏳')

    let images
    try {
        images = await searchPinterest(query)
    } catch {
        await m.react('❌')
        return m.reply(`${HEADER()}\n\n❌ Error al conectar con Pinterest.\n\n_...intenta de nuevo. 🕷️_`)
    }

    if (!images.length) {
        await m.react('❌')
        return m.reply(`${HEADER()}\n\n❌ Sin resultados para: *${query}*\n\n_...prueba otro término. 🕷️_`)
    }

    const key    = `${m.sender}::${query.toLowerCase()}`
    const picked = pickFresh(images, key)

    
    const buffers = await Promise.all(
        picked.map(url =>
            axios.get(url, { responseType: 'arraybuffer', timeout: 15000 })
                .then(r => Buffer.from(r.data))
                .catch(() => null)
        )
    )

    const valid = buffers.filter(Boolean)
    if (!valid.length) {
        await m.react('❌')
        return m.reply(`${HEADER()}\n\n❌ No se pudieron descargar las imágenes.\n\n_...intenta de nuevo. 🕷️_`)
    }

    
    await conn.sendMessage(m.chat, {
        album: valid.map(buf => ({
            image: buf,
            mimetype: 'image/jpeg'
        }))
    }, { quoted: m })

    await m.react('✅')
}

handler.help    = ['pinterest <búsqueda>']
handler.tags    = ['descargas']
handler.command = ['pinterest', 'pin']
handler.register = true

export default handler
