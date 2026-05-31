import axios from 'axios'
const {
    proto,
    generateWAMessageFromContent,
    generateWAMessageContent
} = (await import('@whiskeysockets/baileys')).default

const HEADER  = () => `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠`
const isTtUrl = s => /tiktok\.com|vm\.tiktok|vt\.tiktok/i.test(s)


// Estructura: { "sender::query" => Set<index> }
const _seen = new Map()

function pickFresh(videos, key) {
    if (!_seen.has(key)) _seen.set(key, new Set())
    const seen = _seen.get(key)

    
    if (seen.size >= videos.length) seen.clear()

    
    const pool = videos.map((v, i) => i).filter(i => !seen.has(i))
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]]
    }

    
    const chosen = pool.slice(0, 6)
    for (const i of chosen) seen.add(i)
    return chosen.map(i => videos[i])
}

async function buildCard(v, conn) {
    const { videoMessage } = await generateWAMessageContent(
        { video: { url: v.play } },
        { upload: conn.waUploadToServer }
    )
    return {
        body: proto.Message.InteractiveMessage.Body.fromObject({
            text: (v.title || '🎵 TikTok').slice(0, 100)
        }),
        footer: proto.Message.InteractiveMessage.Footer.fromObject({
            text: `👤 ${v.author?.nickname || 'Anónimo'} • ❤️ ${(v.digg_count || 0).toLocaleString('es')}`
        }),
        header: proto.Message.InteractiveMessage.Header.fromObject({
            title: '',
            hasMediaAttachment: true,
            videoMessage
        }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ buttons: [] })
    }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const text = args.join(' ').trim()

    if (!text) return m.reply(
        `${HEADER()}\n\n` +
        `⚠️ *Sin parámetros*\n` +
        `📌 Uso: *${usedPrefix}${command} <enlace o búsqueda>*\n` +
        `💡 *${usedPrefix}${command} https://vm.tiktok.com/...*\n` +
        `💡 *${usedPrefix}${command} edits anime*\n\n` +
        `_...ingresa un término válido o link._ 🕷️`
    )

    await m.react('⏳')

    try {
        if (isTtUrl(text)) {
            
            const { data } = await axios.get('https://www.tikwm.com/api/', {
                params: { url: text },
                timeout: 12000
            })

            if (data.code !== 0) {
                await m.react('❌')
                return m.reply(`${HEADER()}\n\n❌ Enlace privado o inválido.\n\n_...blinky no pudo acceder. 🕷️_`)
            }

            await conn.sendMessage(m.chat, {
                video: { url: data.data.play },
                caption:
                    `${HEADER()}\n\n` +
                    `🎵 *${(data.data.title || 'TikTok').slice(0, 80)}*\n` +
                    `👤 *${data.data.author?.nickname || 'Anónimo'}*\n` +
                    `❤️ ${(data.data.digg_count || 0).toLocaleString('es')}  ` +
                    `💬 ${(data.data.comment_count || 0).toLocaleString('es')}  ` +
                    `🔁 ${(data.data.share_count || 0).toLocaleString('es')}\n\n` +
                    `_...blinky procesó tu enlace con éxito. 🕷️_`
            }, { quoted: m })

            await m.react('✅')

        } else {
            // ── Búsqueda — carrusel ──────────────────────────
            
            const { data } = await axios.get('https://www.tikwm.com/api/feed/search', {
                params: {
                    keywords: text,
                    region:   'MX',     
                    count:    50,       
                    cursor:   0
                },
                timeout: 12000
            })

            const allVideos = data?.data?.videos
            if (!allVideos?.length) {
                await m.react('❌')
                return m.reply(`${HEADER()}\n\n❌ Sin resultados para: *${text}*\n\n_...busca otro término. 🕷️_`)
            }

            
            const key    = `${m.sender}::${text.toLowerCase()}`
            const picked = pickFresh(allVideos, key)

            
            const cards = await Promise.all(picked.map(v => buildCard(v, conn)))

            const msgContent = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                            body: proto.Message.InteractiveMessage.Body.create({
                                text: `${HEADER()}\n\n🔍 *${text}* — ${picked.length} videos`
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({
                                text: `⸸ región ES/MX • blinky 🕷️`
                            }),
                            header: proto.Message.InteractiveMessage.Header.create({
                                hasMediaAttachment: false
                            }),
                            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                cards
                            })
                        })
                    }
                }
            }, { quoted: m })

            await conn.relayMessage(m.chat, msgContent.message, { messageId: msgContent.key.id })
            await m.react('✅')
        }

    } catch (e) {
        console.error('[TT ERROR]', e.message)
        await m.react('❌')
        m.reply(`${HEADER()}\n\n⚠️ Error inesperado.\n\`${e.message.slice(0, 150)}\`\n\n_...intenta de nuevo. 🕷️_`)
    }
}

handler.help    = ['tiktok <búsqueda o enlace>']
handler.tags    = ['descargas']
handler.command = ['tiktok', 'tt', 'ttsearch']
handler.register = true

export default handler
