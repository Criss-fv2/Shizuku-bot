import { database } from '../lib/database.js'

export default {
    before: async function (m, { conn, isAdmin, isOwner }) {
        if (!m.isGroup) return true
        if (!m.text) return true
        if (isAdmin || isOwner) return true

        if (!database.data.users) database.data.users = {}

        let user = database.data.users[m.sender]
        if (!user) {
            database.data.users[m.sender] = { toxicWarn: 0 }
            user = database.data.users[m.sender]
        }
        if (!user.toxicWarn) user.toxicWarn = 0

        const toxicRegex = /\b(puta|puto|mierda|joder|pendejo|gilipollas|cabrón|zorra|verga|coño|culo|maricón|hdp|hijo de puta|negro|negra|estúpido|idiota|imbécil)\b/i

        if (toxicRegex.test(m.text.toLowerCase())) {
            try { await conn.sendMessage(m.chat, { delete: m.key }) } catch {}

            user.toxicWarn += 1
            await database.save()

            const num = `@${m.sender.split('@')[0]}`

            if (user.toxicWarn === 1) {
                await conn.sendMessage(m.chat, {
                    text:
                        `🕷 *${global.botTag}*\n` +
                        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                        `🕸 ${num} primera advertencia\n` +
                        `🕷 _...las palabras tienen peso. cuídalas._\n` +
                        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                        `${global.author}`,
                    mentions: [m.sender]
                })
            } else if (user.toxicWarn === 2) {
                await conn.sendMessage(m.chat, {
                    text:
                        `🕷 *${global.botTag}*\n` +
                        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                        `🕸 ${num} segunda advertencia\n` +
                        `🕷 _...la próxima no habrá mensaje. solo silencio._\n` +
                        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                        `${global.author}`,
                    mentions: [m.sender]
                })
            } else if (user.toxicWarn >= 3) {
                await conn.sendMessage(m.chat, {
                    text:
                        `🕷 *${global.botTag}*\n` +
                        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                        `🕸 ${num} tercera y última advertencia\n` +
                        `🕷 _...que no vuelva._\n` +
                        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                        `${global.author}`,
                    mentions: [m.sender]
                })
                await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
                user.toxicWarn = 0
                await database.save()
            }

            return false
        }

        return true
    }
}
