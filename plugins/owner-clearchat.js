const handler = async (m, { conn }) => {
    await m.react('🕷️')

    let chats
    try {
        chats = await conn.groupFetchAllParticipating()
    } catch {
        chats = {}
    }

    // Obtener todos los JIDs: grupos + chats individuales del store
    const groupJids = Object.keys(chats)
    const storeJids = conn.chats
        ? [...conn.chats.keys ? conn.chats.keys() : Object.keys(conn.chats)]
        : []

    const todos = [...new Set([...groupJids, ...storeJids])].filter(Boolean)

    if (!todos.length)
        return m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n` +
            `⸸ No encontré chats para limpiar. 🕷️`
        )

    await m.reply(
        `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n` +
        `🕸️ Limpiando *${todos.length}* chats...\n` +
        `_...blinky está trabajando._ 🕷️`
    )

    let exitosos = 0
    let fallidos  = 0

    for (const jid of todos) {
        try {
            await conn.chatModify({ delete: true, lastMessages: [] }, jid)
            exitosos++
            // Pequeña pausa para no saturar la conexión
            await new Promise(r => setTimeout(r, 120))
        } catch {
            try {
                // Fallback: marcar como leído y archivar
                await conn.chatModify({ archive: true, lastMessages: [] }, jid)
                exitosos++
            } catch {
                fallidos++
            }
        }
    }

    await m.react('✅')
    return m.reply(
        `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n` +
        `⸸ *Limpieza completada.*\n\n` +
        `✅ Eliminados: *${exitosos}*\n` +
        `❌ Fallidos:   *${fallidos}*\n\n` +
        `_...el historial fue borrado._ 🕷️`
    )
}

handler.help    = ['clearchat']
handler.tags    = ['owner']
handler.command = ['clearchat', 'limpiar', 'cleanchats']
handler.owner   = true

export default handler
