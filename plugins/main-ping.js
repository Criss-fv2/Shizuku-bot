import speed from 'performance-now'
import { exec } from 'child_process'

const handler = async (m, { conn }) => {
    const start = speed()
    const sentMsg = await m.reply('⸸ _...calculando._')
    const latency = (speed() - start).toFixed(0)

    // Ping real al servidor de WhatsApp
    exec('ping -c 1 web.whatsapp.com', (err, stdout) => {
        let waPing = '?'
        if (!err && stdout) {
            const match = stdout.match(/time=([\d.]+)/)
            if (match) waPing = parseFloat(match[1]).toFixed(0)
        }

        exec('neofetch --stdout', (error, sysOut) => {
            const sysInfo = error ? '' : '\n' + sysOut
                .toString('utf-8')
                .replace(/Memory:/, 'RAM:')
                .trim()

            const uptime = process.uptime()
            const h = Math.floor(uptime / 3600)
            const min = Math.floor((uptime % 3600) / 60)
            const seg = Math.floor(uptime % 60)

            const result =
                `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n` +
                `⸸ *Latencia bot:* ${latency}ms\n` +
                `⸸ *Ping WA:* ${waPing}ms\n` +
                `⸸ *Uptime:* ${h}h ${min}m ${seg}s\n` +
                `⸸ *Memoria:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB usados\n` +
                (sysInfo ? `\n${sysInfo}\n` : '') +
                `\n_...el sistema responde. por ahora._ 🕷️`

            conn.sendMessage(m.chat, { text: result, edit: sentMsg.key }, { quoted: m })
        })
    })
}

handler.help = ['ping']
handler.tags = ['main']
handler.command = ['ping']

export default handler
