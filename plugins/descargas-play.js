import axios from 'axios'
import yts from 'yt-search'

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const query = args.join(' ').trim()

  if (!query) {
    return conn.sendMessage(msg.chat, {
      text: `❌ *Error:*\n> Debes escribir el nombre de la canción o un enlace de YouTube.`
    }, { quoted: msg })
  }

  // ⏳ Reacción de inicio (Procesando)
  await conn.sendMessage(msg.chat, { react: { text: '⏳', key: msg.key } })

  try {
    // 1. Buscar el video en YouTube
    const search = await yts(query)
    if (!search.videos?.length) throw new Error('No se encontraron resultados para tu búsqueda.')

    const video = search.videos[0]
    const youtubeUrl = video.url

    // 2. Llamada a tu API personalizada
    const apikey = 'dvyer696571349809'
    const apiUrl = `https://dv-yer-api.online/ytmp3?mode=link&url=${encodeURIComponent(youtubeUrl)}&apikey=${apikey}`
    
    const { data } = await axios.get(apiUrl)

    // Validamos según el JSON de respuesta que me pasaste (ok: true y download_url)
    if (!data?.ok || !data?.download_url) {
      throw new Error('La API de DV-YER no pudo procesar este audio en este momento.')
    }

    const title = data.title || video.title || 'Audio de YouTube'
    const thumbnail = data.thumbnail || video.thumbnail
    const author = video.author?.name || 'Desconocido'
    const duration = video.timestamp || 'N/A'
    const audioUrl = data.download_url

    // 3. Formateamos la caja de información estilo Zore-Two
    const info = formatBox(title, author, duration)

    // 4. Enviamos la miniatura con la información
    await conn.sendMessage(msg.chat, {
      image: { url: thumbnail },
      caption: info
    }, { quoted: msg })

    // 5. Enviamos el archivo de Audio (MP3)
    await conn.sendMessage(msg.chat, {
      audio: { url: audioUrl },
      mimetype: 'audio/mpeg',
      fileName: `${sanitizeFilename(title)}.mp3`
    }, { quoted: msg })

    // ✅ Reacción de éxito (Finalizado)
    await conn.sendMessage(msg.chat, { react: { text: '✅', key: msg.key } })

  } catch (error) {
    console.error('Error en play.js:', error)
    // ❌ Reacción de error
    await conn.sendMessage(msg.chat, { react: { text: '❌', key: msg.key } })
    await conn.sendMessage(msg.chat, {
      text: `❌ *Error:* ${error.message}`
    }, { quoted: msg })
  }
}

handler.help = ['play <título>', 'ytmp3 <título>']
handler.tags = ['descargas']
handler.command = ['play', 'ytmp3']

export default handler

// --- FUNCIONES DE IDENTIDAD ZORE-TWO ---

function sanitizeFilename(name = 'audio') {
  return name.replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 100)
}

function formatBox(title, author, time) {
  const line = '════════════'
  return (
`╔✦★✦${line}✦★✦╗
🎵 ${title}
👤 ${author}
⏱️ ${time}
╚✦★✦${line}✦★✦╝`
  )
}

