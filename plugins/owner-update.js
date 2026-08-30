import { exec } from 'child_process'

const handler = async (m, { conn }) => {
    let sentMsg = await m.reply('🕷 *Shizuku System*\n\n🖤 Iniciando actualización...')

    exec('git pull origin main', (err, stdout, stderr) => {
        if (err) {
            exec('git fetch origin && git reset --hard origin/main', (err2, stdout2, stderr2) => {
                if (err2) {
                    conn.sendMessage(m.chat, {
                        text: `🕸 *Shizuku System*\n\n🖤 Error al actualizar\n\`\`\`${err2.message.slice(0, 300)}\`\`\``,
                        edit: sentMsg.key
                    }, { quoted: m })
                    return
                }

                conn.sendMessage(m.chat, {
                    text: `🕷 *Shizuku System*\n\n🖤 Actualización forzada completada\n\n🕸 Archivos actualizados:\n\`\`\`${stdout2 || 'Sin cambios detectados'}\`\`\``,
                    edit: sentMsg.key
                }, { quoted: m })
            })
            return
        }

        if (stdout.includes('Already up to date.')) {
            conn.sendMessage(m.chat, {
                text: '🕷 *Shizuku System*\n\n🖤 Ya estaba todo al día\n🕸 No había cambios que descargar',
                edit: sentMsg.key
            }, { quoted: m })
        } else {
            conn.sendMessage(m.chat, {
                text: `🕷 *Shizuku System*\n\n🖤 Actualización completada\n\n🕸 Cambios descargados:\n\`\`\`${stdout}\`\`\``,
                edit: sentMsg.key
            }, { quoted: m })
        }
    })
}

handler.help = ['update']
handler.tags = ['owner']
handler.command = ['update']
handler.owner = true


export default handler
