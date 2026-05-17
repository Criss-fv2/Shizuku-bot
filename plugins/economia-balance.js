import { database } from '../lib/database.js'

const handler = async (m, { conn }) => {
    if (!database.data.users) database.data.users = {}
    if (!database.data.users[m.sender]) {
        return m.reply('⚠️ No tienes economía aún. Usa .work para comenzar.')
    }

    const user = database.data.users[m.sender]
    if (!user.eco) {
        return m.reply('⚠️ No tienes economía aún. Usa .work para comenzar.')
    }

    const eco = user.eco
    const total = eco.dinero + eco.banco

    m.reply(`
╭─────────────────────────╮
│     💰 TU ECONOMÍA      │
╰─────────────────────────╯

👤 Usuario: ${user.name}

💵 En mano: ${eco.dinero} Nen
🏦 En banco: ${eco.banco} Nen
💰 Total: ${total} Nen

📊 Nivel: ${eco.level}
⭐ Experiencia: ${eco.exp}
📈 Trabajos: ${eco.trabajos_realizados}

🎁 Posesiones: ${eco.posesiones.length > 0 ? eco.posesiones.join(', ') : 'Ninguna'}

> ShizukuSystem
`)
}

handler.help = ['balance']
handler.tags = ['economia']
handler.command = ['balance', 'bal', 'saldo', 'wallet']

export default handler
