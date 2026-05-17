import axios from 'axios'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const prefix = usedPrefix || global.prefix || '.'
    const currentCommand = command || 'tiktok'
    const text = args.join(' ').trim()

    if (!text) {
        return m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n` +
            `⚠️ *Error de parámetros*\n` +
            `📌 Uso: *${prefix}${currentCommand} <enlace o búsqueda>*\n` +
            `💡 Ejemplo 1: *${prefix}${currentCommand} https://vm.tiktok.com/...*\n` +
            `💡 Ejemplo 2: *${prefix}${currentCommand} edits anime*\n\n` +
            `_...ingresa un término válido o link._ 🕷️`
        )
    }

    await m.react('⏳')

    try {
        // ==========================================
        // 🔗 MODO 1: ENLACE DIRECTO
        // ==========================================
        if (text.includes('http')) {
            const { data } = await axios.get(`https://www.tikwm.com/api/?url=${text}`)
            
            if (data.code === 0) {
                const captionText = 
                    `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n` +
                    `🎵 *TikTok Descargado*\n` +
                    `👤 *Autor:* ${data.data.author.nickname || 'Anónimo'}\n\n` +
                    `_...blinky procesó tu enlace con éxito._ 🕷️`

                await conn.sendMessage(m.chat, { 
                    video: { url: data.data.play }, 
                    caption: captionText 
                }, { quoted: m })
                
                await m.react('✅')
            } else {
                await m.react('❌')
                return m.reply('❌ El enlace proporcionado es privado o inválido, darling~')
            }
        } 
        // ==========================================
        // 🔍 MODO 2: BÚSQUEDA POR TEXTO
        // ==========================================
        else {
            const { data } = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(text)}`)
            
            if (data.data && data.data.videos && data.data.videos.length > 0) {
                const videos = data.data.videos.slice(0, 4)

                await Promise.all(videos.map(async (v) => {
                    await conn.sendMessage(m.chat, { 
                        video: { url: v.play } 
                    })
                }))

                const captionText = 
                    `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n` +
                    `🌸 *Búsqueda:* ${text}\n` +
                    `⸸ *Videos enviados:* ${videos.length}/4\n\n` +
                    `_...blinky entregó tu ráfaga de clips con éxito._ 🕷️`

                await conn.sendMessage(m.chat, { text: captionText }, { quoted: m })
                await m.react('✅')
            } else {
                await m.react('❌')
                return m.reply('❌ No encontré videos que coincidan con esa búsqueda, darling~')
            }
        }
    } catch (error) {
        console.error(error)
        await m.react('❌')
        m.reply(`💔 Error crítico en la infraestructura de descarga del sistema.`)
    }
}

handler.help = ['tiktok <búsqueda/enlace>']
handler.tags = ['descargas']
handler.command = ['tiktok', 'tt', 'ttsearch']
handler.register = true

export default handler
