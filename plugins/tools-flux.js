
import axios from 'axios'

// Almacenamiento temporal para evadir bloqueos severos
global.fluxCircuitBreaker = global.fluxCircuitBreaker || {}

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

  const seed = Math.floor(Math.random() * 9999999)
  const encoded = encodeURIComponent(query)

  // Enlaces espejo optimizados
  const providers = [
    { id: 'pollinations_flux', url: `https://image.pollinations.ai/p/${encoded}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}` },
    { id: 'bk9_flux', url: `https://api.bk9.site/ai/flux?q=${encoded}` },
    { id: 'widipe_flux', url: `https://widipe.com/flux?text=${encoded}` },
    { id: 'pollinations_turbo', url: `https://image.pollinations.ai/p/${encoded}?width=1024&height=1024&model=turbo&seed=${seed}` }
  ]

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  ]

  // Generador de IPs aleatorias para romper el rastreo por IP (Rate-Limit bypass)
  const generateFakeIP = () => {
    return `${Math.floor(Math.random() * 210) + 15}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254) + 1}`
  }

  let buffer = null
  let success = false
  const now = Date.now()

  for (const provider of providers) {
    // Saltarse temporalmente solo si está en penalización dura
    if (global.fluxCircuitBreaker[provider.id] && now < global.fluxCircuitBreaker[provider.id]) {
      continue
    }

    try {
      const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)]
      const fakeIP = generateFakeIP()

      const res = await axios.get(provider.url, { 
        responseType: 'arraybuffer', 
        timeout: 30000, // 30 segundos: tiempo justo para prompts hiperrealistas
        headers: { 
          'User-Agent': randomUA,
          'X-Forwarded-For': fakeIP,
          'X-Real-IP': fakeIP,
          'X-Client-IP': fakeIP,
          'CF-Connecting-IP': fakeIP
        }
      })
      
      const contentType = res.headers['content-type'] || ''
      if (!contentType.includes('image') || !res.data || res.data.byteLength < 3000) {
        global.fluxCircuitBreaker[provider.id] = now + 45000 // Penalización corta de 45 seg si manda texto
        continue
      }

      buffer = Buffer.from(res.data)
      success = true
      break 

    } catch (error) {
      // Si la API solo tardó en responder (Timeout), enfriamiento leve de 10 segundos, no bloqueo total
      const isTimeout = error.code === 'ECONNABORTED'
      global.fluxCircuitBreaker[provider.id] = now + (isTimeout ? 10000 : 45000)
      continue
    }
  }

  if (!success || !buffer) {
    await msg.react('❌')
    return conn.sendMessage(
      msg.chat,
      { text: `❌ *Saturación Total*\n\nLas conexiones externas están saturadas en este instante. Dale un respiro de 30 segundos al bot y reintenta.` },
      { quoted: msg }
    )
  }

  try {
    await conn.sendMessage(
      msg.chat,
      { image: buffer, caption: `🖤 *IMAGEN GENERADA*\n🕷️ *Prompt:* ${query}` },
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
