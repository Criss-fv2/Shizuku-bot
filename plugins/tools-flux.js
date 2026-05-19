

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

  const endpoints = [
    `https://image.pollinations.ai/p/${encodeURIComponent(query)}?width=1024&height=1024&model=flux&seed=${Math.floor(Math.random() * 100000)}`,
    `https://api.bk9.site/ai/flux?q=${encodeURIComponent(query)}`
  ]

  let buffer = null
  let success = false

  for (const url of endpoints) {
    try {
      const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 })
      
    
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
      { text: `❌ *FALLO DE ENTORNO*\n\nLos servidores devolvieron texto o peticiones bloqueadas. Modifica el prompt.` },
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
