import cp, { exec as _exec } from 'child_process'
import { promisify } from 'util'

const exec = promisify(_exec).bind(cp)

let handler = async (m, { conn, args }) => {
    const text = args.join(' ')

    if (!text) return m.reply(
        `🕷 *${global.botTag}*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `🕸 Ingresa un comando de terminal\n` +
        `🕷 Ejemplo: *$ ls -la*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `${global.author}`
    )

    await m.react('🕷')

    let o
    try {
        o = await exec(text.trimEnd())
        await m.react('🕸')
    } catch (e) {
        o = e
        await m.react('🕷')
    } finally {
        const { stdout, stderr } = o

        if (stdout?.trim()) {
            await m.reply(
                `🕷 *${global.botTag}*\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `🕸 *Resultado:*\n\`\`\`${stdout.trim().slice(0, 3000)}\`\`\`\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `${global.author}`
            )
        }

        if (stderr?.trim()) {
            await m.reply(
                `🕷 *${global.botTag}*\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `🕸 *Error:*\n\`\`\`${stderr.trim().slice(0, 3000)}\`\`\`\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `${global.author}`
            )
        }
    }
}

handler.help = ['$']
handler.tags = ['owner']
handler.customPrefix = ['$']
handler.command = new RegExp
handler.rowner = true

export default handler
