import { database } from '../lib/database.js'

const handler = async (m, { conn, args, who }) => {
    const groupId = m.chat

    // Resolver who igual que el mute
    let target = who
    if (m.mentionedJid?.length > 0) {
        target = m.mentionedJid[0]
    } else if (m.quoted?.sender) {
        target = m.quoted.sender
    }

    if (!target) return m.reply('💗 Menciona o responde a alguien darling~')

    // Resolver LID a JID
    if (target.endsWith('@lid') || isNaN(target.split('@')[0])) {
        try {
            const groupMeta = await conn.groupMetadata(m.chat)
            const found = groupMeta.participants.find(p => p.id === target || p.lid === target)
            if (found?.jid) target = found.jid
        } catch {}
    }

    if (!database.data.groups) database.data.groups = {}
    if (!database.data.groups[groupId]) database.data.groups[groupId] = {}
    if (!database.data.groups[groupId].warnings) database.data.groups[groupId].warnings = {}

    const warns = database.data.groups[groupId].warnings

    const ownerNums = global.owner.map(o => (Array.isArray(o) ? o[0] : o).replace(/\D/g, ''))
    if (ownerNums.includes(target.split('@')[0])) {
        return m.reply('ꕦ No puedo advertir a un desarrollador de mi staff~ 𖤐')
    }

    const reason = args.slice(1).join(' ') || 'Sin razón especificada'

    if (!warns[target]) warns[target] = { count: 0, reasons: [] }
    warns[target].count++
    warns[target].reasons.push(reason)
    await database.save()

    const count = warns[target].count

    if (count >= 3) {
        await conn.sendMessage(m.chat, {
            text:
                `𖤐 *¡ADVERTENCIA #${count}!* 𖤐\n\n` +
                `ꕦ Usuario: @${target.split('@')[0]}\n` +
                `ꕦ Razón: ${reason}\n\n` +
                `💔 *Superó las 3 advertencias y fue expulsado...*\n` +
                `Vuela lejos darling~ 🌸`,
            mentions: [target]
        }, { quoted: m })

        try {
            await conn.groupParticipantsUpdate(m.chat, [target], 'remove')
        } catch (e) {
            console.error('[WARN KICK ERROR]', e.message)
        }

        delete warns[target]
        await database.save()
    } else {
        await conn.sendMessage(m.chat, {
            text:
                `𖤐 *¡ADVERTENCIA #${count}!* 𖤐\n\n` +
                `ꕦ Usuario: @${target.split('@')[0]}\n` +
                `ꕦ Razón: ${reason}\n\n` +
                `ꙮ Advertencias: *${count}/3*\n` +
                `💗 La próxima te vas volando darling~ 🌸`,
            mentions: [target]
        }, { quoted: m })
    }

    await m.react('💗')
}

handler.help = ['advertir @user [razón]']
handler.tags = ['grupo']
handler.command = ['advertir', 'advertencia', 'warn', 'warning']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
