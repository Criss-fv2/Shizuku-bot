let handler = async (m, { conn }) => {
    try {
        const link = 'https://chat.whatsapp.com/' + await conn.groupInviteCode(m.chat)
        await m.reply(`🕸 *Link del grupo de 𝑺𝒉𝒊𝒛𝒖𝒌𝒖~ *\n\n${link}`)
    } catch (e) {
        await m.reply('💔 Darling, no pude obtener el link del grupo~')
    }
}

handler.help = ['link']
handler.tags = ['grupo']
handler.command = ['link', 'enlace']
handler.group = true

export default handler
