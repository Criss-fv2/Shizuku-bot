import fs from 'fs'

export const RESTART_FILE = './restart.json'

let handler = async (m, { conn }) => {
    fs.writeFileSync(RESTART_FILE, JSON.stringify({
        chat: m.chat,
        sender: m.sender,
        time: Date.now()
    }))

    await m.reply(
        `🕷 *${global.botTag}*\n\n` +
        `🕸 Reiniciando sistema...\n` +
        `🕷 Avisaré cuando esté listo\n\n` +
        `${global.dev}`
    )

    setTimeout(() => process.exit(0), 2000)
}

handler.help = ['reiniciar']
handler.tags = ['owner']
handler.command = ['restart', 'reiniciar']
handler.owner = true


export default handler
