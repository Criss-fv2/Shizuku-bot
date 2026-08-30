const handler = async (m, { conn, who }) => {
    if (!who) return m.reply('⚠️ *MENCIONA O RESPONDE A UN USUARIO*')

    try {
        await conn.groupParticipantsUpdate(m.chat, [who], 'promote')
        m.reply('✅ Usuario ahora es administrador')
    } catch {
        m.reply('❌ No se pudo promover al usuario')
    }
}

handler.command = ['promote', 'daradmin', 'admin']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler