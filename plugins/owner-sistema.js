import { readLogs } from '../lib/logger.js'

let handler = async (m, { isOwner }) => {
  if (!isOwner) return m.reply('⸸ ...solo para mis creadores.')

  const logs = readLogs(20)
  await m.reply(`📋 *Últimos 20 registros:*\n\n\`\`\`${logs}\`\`\``)
}

handler.help = ['sistema']
handler.tags = ['owner']
handler.command = ['logs']
handler.owner = true

export default handler
