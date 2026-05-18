let handler = async (m, { conn }) => {
    await m.react('🕷')

    const botname = global.botname || '𝑺𝒉𝒊𝒛𝒖𝒌𝒖'
    const prefix = global.prefix || '#'
    const version = 'v2.0'  
    const runtime = process.uptime()
    const hours = Math.floor(runtime / 3600)
    const minutes = Math.floor((runtime % 3600) / 60)
    const seconds = Math.floor(runtime % 60)

    const infoText = `🕸 *INFO DEL BOT - ${botname}* 🕸\n\n` +
                     `◾️ *Nombre:* ${botname}\n` +
                     `▪️ *Prefijo:* ${prefix}\n` +
                     `✨ *Versión:* ${version}\n` +
                     `✨ *Tiempo activo:* ${hours}h ${minutes}m ${seconds}s\n` +
                     `✨ *Creado por:* ZoreDevTeam\n` +
                     `✨ *Repo GitHub:* https://github.com/Criss-fv/Shizuku-bot\n` +
                     `✨ *Canal oficial:* https://whatsapp.com/channel/0029VbD0BCmHLHQZCYJ7d42K\n\n` +
                     `¡Soy Shizuku y estoy lista para ayudarte\~! 🖤\n` +
                     `¿Qué quieres hacer hoy? 🕷`

    await m.reply(infoText)
    await m.react('🕸')
}

handler.help = ['infobot', 'botinfo']
handler.tags = ['main']
handler.command = ['infobot', 'botinfo', 'info']

export default handler
