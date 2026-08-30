// ╔══════════════════════════════════════════════════════════════╗
// ║                  RCANAL INFO — ZERO TWO                     ║
// ║                  power by ZoreDevTeam                       ║
// ╚══════════════════════════════════════════════════════════════╝

import { database } from '../lib/database.js'

const plugin = async (m, { conn }) => {
    await global.sendWithCtx(conn, m.chat, {
        text:
`╭──────────────────────────╮
│   💗 *CANAL ZERO TWO* 💗    │
╰──────────────────────────╯

📡 Síguenos en nuestro canal oficial:
› 🌸 Actualizaciones del bot
› 💎 Noticias y novedades
› 🎁 Sorteos y eventos especiales
› 🔧 Mantenimientos y cambios

🔗 *Únete aquí:*
${global.rcanal}

> ${global.dev}`
    }, database.data, { quoted: m })
}

plugin.command     = ['rcanal', 'canal', 'channel']
plugin.description = 'Muestra info del canal oficial de Zero Two'
plugin.owner       = false
plugin.group       = false
plugin.private     = false
plugin.register    = false
plugin.premium     = false
plugin.limit       = false

export default plugin