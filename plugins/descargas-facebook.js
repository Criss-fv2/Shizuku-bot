import fetch from 'node-fetch'

const HEADER = () => `✠ ══〔 ${global.namebot || 'S H I Z U K U'} 〕══ ✠`
const FOOTER = () => `_${global.textbot || '⸸ Shizuku Murasaki. Araña Nº8.'}_`
const isFacebook = url => /facebook\.com|fb\.watch/i.test(url)
const API = url => `https://api--shadowcorexyz.replit.app/download/facebook/v2?url=${encodeURIComponent(url)}`

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const prefix = usedPrefix || '.'
  const url = (args[0] || '').trim()

  if (!url) return m.reply(`${HEADER()}\n\n⚠️ *Sin enlace*\n📌 Uso: *${prefix}${command} <link de Facebook>*\n\n_...solo acepto enlaces de Facebook. 🕷️_`)
  if (!isFacebook(url)) return m.reply(`${HEADER()}\n\n❌ *Enlace no válido*\n💡 Solo acepto links de *facebook.com* o *fb.watch*\n\n_...ese no es un enlace de Facebook. 🕷️_`)

  await m.react('⏳')

  try {
    const json = await fetch(API(url), { timeout: 20000 }).then(r => r.json())
    if (!json.status || !json.result?.length) throw new Error()

    const video = json.result.find(v => v.quality === 'HD') || json.result[0]

    await Promise.all([
      conn.sendMessage(m.chat, {
        video: { url: video.url },
        caption: `${HEADER()}\n\n✅ *Descarga completada*\n🌐 *Fuente:* Facebook\n📺 *Calidad:* ${video.quality === 'HD' ? '🔵 HD' : '🟡 SD'}\n\n${FOOTER()}`
      }, { quoted: m }),
      m.react('✅')
    ])

  } catch {
    await m.react('❌')
    m.reply(`${HEADER()}\n\n⚠️ *No se pudo descargar el video*\n\n📋 *Posibles causas:*\n• El video es privado o solo para amigos\n• El enlace está caído o expiró\n• Facebook bloqueó el acceso temporalmente\n\n_...la red de Blinky no llegó hasta allá. 🕷️_`)
  }
}

handler.command = ['fb', 'facebook', 'fbdl']
handler.tags    = ['descargas']
handler.help    = ['fb <link de Facebook>']

export default handler
