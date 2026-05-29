import axios from 'axios'
const {
  proto,
  generateWAMessageFromContent,
  generateWAMessageContent
} = (await import("@whiskeysockets/baileys")).default;

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

    async function createVideoMessage(url) {
        const { videoMessage } = await generateWAMessageContent({
            video: { url }
        }, {
            upload: conn.waUploadToServer
        });
        return videoMessage;
    }

    try {
        // ==========================================
        // 🔗 MODO 1: ENLACE DIRECTO (sin carrusel, es un solo video)
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
        // 🔍 MODO 2: BÚSQUEDA — CARRUSEL
        // ==========================================
        else {
            const { data } = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(text)}`)

            if (data.data && data.data.videos && data.data.videos.length > 0) {
                const videos = data.data.videos.slice(0, 7)

                // Construimos las cards del carrusel
                const cards = []
                for (const v of videos) {
                    cards.push({
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: v.title || '🎵 TikTok'
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: `👤 ${v.author?.nickname || 'Anónimo'} • ❤️ ${v.digg_count || 0}`
                        }),
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: '',
                            hasMediaAttachment: true,
                            videoMessage: await createVideoMessage(v.play)
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: []
                        })
                    })
                }

                const messageContent = generateWAMessageFromContent(m.chat, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },
                            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                body: proto.Message.InteractiveMessage.Body.create({
                                    text: `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠\n\n🔍 Resultados para: *${text}*`
                                }),
                                footer: proto.Message.InteractiveMessage.Footer.create({
                                    text: `⸸ ${videos.length} videos encontrados • blinky 🕷️`
                                }),
                                header: proto.Message.InteractiveMessage.Header.create({
                                    hasMediaAttachment: false
                                }),
                                carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                    cards: [...cards]
                                })
                            })
                        }
                    }
                }, {
                    quoted: m
                })

                await conn.relayMessage(m.chat, messageContent.message, {
                    messageId: messageContent.key.id
                })

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
