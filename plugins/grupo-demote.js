const handler = async (m, { conn, who }) => {
    if (!who) return m.reply('⚠️ *MENCIONA O RESPONDE A UN USUARIO*')

    try {
        await conn.groupParticipantsUpdate(m.chat, [who], 'demote')
        m.reply('✅ Usuario ya no es administrador')
    } catch {
        m.reply('❌ No se pudo quitar el admin')
    }
}

handler.command = ['demote', 'quitaradmin', 'unadmin']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler