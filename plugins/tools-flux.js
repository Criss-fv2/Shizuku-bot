// ═════════════════════════════════════════════════════════════════
// SYSTEM: Matriz de Renderizado con Disyuntor de Red Dinámico
// RUTA: plugins/tools-flux.js
// ═════════════════════════════════════════════════════════════════

import axios from 'axios'

// Memoria volátil del sistema para aislar servidores saturados
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

  const seed = Math.floor(Math.random() * 999999)
  const encoded = encodeURIComponent(query)

  // Pool diversificado de motores gráficos independientes
  const providers = [
    { id: 'pollinations_flux', url: `https://image.pollinations.ai/p/${encoded}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}` },
    { id: 'widipe_flux', url: `https://widipe.com/flux?text=${encoded}` },
    { id: 'bk9_flux', url: `https://api.bk9.site/ai/flux?q=${encoded}` },
    { id: 'pollinations_turbo', url: `https://image.pollinations.ai/p/${encoded}?width=1024&height=1024&model=turbo&seed=${seed}` }
  ]

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Mobile Safari/537.36'
  ]

  let buffer = null
  let success = false
  const now = Date.now()

  for (const provider of providers) {
    // Si la API está penalizada en la caché por bloqueos anteriores, se descarta sin perder tiempo
    if (global.fluxCircuitBreaker[provider.id] && now < global.fluxCircuitBreaker[provider.id]) {
      continue
    }

    try {
      const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)]
      const res = await axios.get(provider.url, { 
        responseType: 'arraybuffer', 
        timeout: 9000, // Tiempo límite corto para saltar rápido si hay latencia
        headers: { 'User-Agent': randomUA }
      })
      
      const contentType = res.headers['content-type'] || ''
      if (!contentType.includes('image') || !res.data || res.data.byteLength < 2000) {
        // Servidor mandó basura o error camuflado: Se penaliza por 2 minutos
        global.fluxCircuitBreaker[provider.id] = now + 120000 
        continue
      }

      buffer = Buffer.from(res.data)
      success = true
      break 

    } catch {
      // Caída crítica de conexión: Se penaliza inmediatamente
      global.fluxCircuitBreaker[provider.id] = now + 120000
      continue
    }
  }

  if (!success || !buffer) {
    await msg.react('❌')
    return conn.sendMessage(
      msg.chat,
      { text: `❌ *COLAPSO DE ENTORNO*\n\nToda la red externa de IA aplicó Rate-Limit a tu IP. Espera 1 o 2 minutos a que se limpie el disyuntor.` },
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
handler.tags = ['ai']
handler.command = ['flux']

export default handler
