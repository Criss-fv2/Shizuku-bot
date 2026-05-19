
import axios from 'axios'

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const query = args.join(' ').trim()

  if (!query) {
    await msg.react('🕷️')
    return conn.sendMessage(
      msg.chat,
      { text: `🕸️ *SISTEMA COMPACTO*\n\nInserta una descripción lógica.\nUso: *${usedPrefix}${command} <descripción>*` },
      { quoted: msg }
    )
  }

  await msg.react('🕸️')

  // Base de datos de agentes de usuario para engañar al cortafuegos de la API
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
  ]

  const seed = Math.floor(Math.random() * 999999)
  const encodedPrompt = encodeURIComponent(query)

  // Ruta de servidores diversificada para evitar colapsos por IP
  const endpoints = [
    `https://image.pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`,
    `https://widipe.com/flux?text=${encodedPrompt}`,
    `https://api.bk9.site/ai/flux?q=${encodedPrompt}`,
    `https://image.pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&model=turbo&seed=${seed}`
  ]

  let buffer = null
  let success = false

  for (const url of endpoints) {
    try {
      const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)]
      const res = await axios.get(url, { 
        responseType: 'arraybuffer', 
        timeout: 15000,
        headers: { 'User-Agent': randomUA } // Inyección de identidad falsa
      })
      
      const contentType = res.headers['content-type'] || ''
      if (!contentType.includes('image')) {
        continue
      }

      if (res.data && res.data.byteLength > 1000) {
        buffer = Buffer.from(res.data)
        success = true
        break
      }
    } catch {
      continue
    }
  }

  if (!success || !buffer) {
    await msg.react('❌')
    return conn.sendMessage(
      msg.chat,
      { text: `❌ *FALLO DE ENTORNO*\n\nTráfico saturado en la red externa. Espera unos segundos y cambia el prompt.` },
      { quoted: msg }
    )
  }

  try {
    await conn.sendMessage(
      msg.chat,
      {
        image: buffer,
        caption: `🖤 *IMAGEN GENERADA*\n🕷️ *Prompt:* ${query}`
      },
      { quoted: msg }
    )
    await msg.react('🖤')
  } catch (e) {
    console.error(e)
    await msg.react('❌')
  }
}

handler.help = ['flux']
handler.tags = ['tools']
handler.command = ['flux']

export default handler
