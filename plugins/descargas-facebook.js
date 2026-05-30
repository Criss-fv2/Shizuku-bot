import fetch from 'node-fetch'

const HEADER = () => `✠ ══〔 ${global.namebot || 'S H I Z U K U'} 〕══ ✠`
const FOOTER = () => `_${global.textbot || '⸸ Shizuku Murasaki. Araña Nº8.'}_`

const isFacebook = url => /facebook\.com|fb\.watch/i.test(url)

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const prefix = usedPrefix || '.'
  const url = (args[0] || '').trim()

  if (!url) {
    return m.reply(
      `${HEADER()}\n\n` +
      `⚠️ *Sin enlace*\n` +
      `📌 Uso: *${prefix}${command} <link de Facebook>*\n\n` +
      `_...solo acepto enlaces de Facebook. 🕷️_`
    )
  }

  if (!isFacebook(url)) {
    return m.reply(
      `${HEADER()}\n\n` +
      `❌ *Enlace no válido*\n` +
      `💡 Solo acepto links de *facebook.com* o *fb.watch*\n\n` +
      `_...ese no es un enlace de Facebook. 🕷️_`
    )
  }

  await m.react('⏳')

  try {
    const apiUrl = `https://api--shadowcorexyz.replit.app/download/facebook/v2?url=${encodeURIComponent(url)}`
    const res    = await fetch(apiUrl, { timeout: 25000 })
    const json   = await res.json()

    if (!json.status || !json.result?.length) throw new Error('sin resultado')

    const video   = json.result.find(v => v.quality === 'HD') || json.result[0]
    const calidad = video.quality === 'HD' ? '🔵 HD' : '🟡 SD'

    await conn.sendMessage(m.chat, {
      video: { url: video.url },
      caption:
        `${HEADER()}\n\n` +
        `✅ *Descarga completada*\n` +
        `🌐 *Fuente:* Facebook\n` +
        `📺 *Calidad:* ${calidad}\n\n` +
        `${FOOTER()}`
    }, { quoted: m })

    await m.react('✅')

  } catch (e) {
    await m.react('❌')
    m.reply(
      `${HEADER()}\n\n` +
      `⚠️ *No se pudo descargar el video*\n\n` +
      `📋 *Posibles causas:*\n` +
      `• El video es privado o solo para amigos\n` +
      `• El enlace está caído o expiró\n` +
      `• Facebook bloqueó el acceso temporalmente\n\n` +
      `_...la red de Blinky no llegó hasta allá. 🕷️_`
    )
  }
}

handler.command = ['fb', 'facebook', 'fbdl']
handler.tags    = ['descargas']
handler.help    = ['fb <link de Facebook>']

export default handler
