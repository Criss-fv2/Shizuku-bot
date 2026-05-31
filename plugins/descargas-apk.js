import fetch from 'node-fetch'

const API     = 'https://api.alyacore.xyz/search/apk'
const API_KEY = global.apiConfigs?.alyacore?.key || 'Shizuku-bot'
const MAX_MB  = 95
const MAX_B   = MAX_MB * 1024 * 1024
const UA      = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36'

async function searchAPK(query) {
    const res  = await fetch(`${API}?query=${encodeURIComponent(query)}&key=${API_KEY}`, {
        headers: { 'User-Agent': UA },
        timeout: 15000
    })
    const json = await res.json()
    if (!json?.status || !json?.data) throw new Error(json?.message || 'Sin resultados.')
    return json.data
}

function parseSizeMB(sizeStr = '') {
    const n = parseFloat(sizeStr)
    return isNaN(n) ? null : n
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
    const query = args.join(' ').trim()

    if (!query)
        return m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝕻𝕶 〕══ ✠\n\n` +
            `⸸ Escribe el nombre de la app.\n\n` +
            `› *${usedPrefix}${command} whatsapp*\n` +
            `› *${usedPrefix}${command} minecraft*\n` +
            `› *${usedPrefix}${command} spotify premium*\n\n` +
            `_...si existe, lo consigo._ 🕷️`
        )

    await m.react('🔍')

    try {
        const data = await searchAPK(query)

        const { name, package: pkg, size, lastUpdated, banner, dl } = data
        const sizeMB   = parseSizeMB(size)
        const sizeBytes = sizeMB ? sizeMB * 1024 * 1024 : null
        const fecha    = lastUpdated ? lastUpdated.split(' ')[0] : 'N/A'
        const fileName = `${name.replace(/[^a-zA-Z0-9]/g, '_')}.apk`

        const caption =
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝕻𝕶 〕══ ✠\n\n` +
            `📦 *${name}*\n` +
            `🔖 Package: \`${pkg}\`\n` +
            `💾 Tamaño: ${size || 'N/A'}\n` +
            `📅 Actualizado: ${fecha}\n\n` +
            `_${global.dev}_ 🕷️`

        // ── APK dentro del límite → descargar y enviar directo ────────────────
        if (!sizeBytes || sizeBytes <= MAX_B) {
            await m.reply(
                `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝕻𝕶 〕══ ✠\n\n` +
                `⏳ Descargando *${name}*...\n` +
                `💾 ${size || '?'} — puede tardar un momento.\n` +
                `_...blinky está en ello._ 🕷️`
            )

            await m.react('⬇️')

            const dlRes  = await fetch(dl, { headers: { 'User-Agent': UA }, timeout: 90000 })
            const buffer = Buffer.from(await dlRes.arrayBuffer())

            
            if (banner) {
                await conn.sendMessage(m.chat, {
                    image: { url: banner },
                    caption
                }, { quoted: m })
            }

            await conn.sendMessage(m.chat, {
                document: buffer,
                mimetype: 'application/vnd.android.package-archive',
                fileName,
                caption: banner ? `_${global.dev}_ 🕷️` : caption
            }, { quoted: m })

            await m.react('✅')

        // ── APK muy grande → mandar link directo ─────────────────────────────
        } else {
            if (banner) {
                await conn.sendMessage(m.chat, {
                    image: { url: banner },
                    caption:
                        caption +
                        `\n⚠️ *${size}* supera el límite de ${MAX_MB}MB de WhatsApp.\n` +
                        `🔗 Descarga directa:\n${dl}`
                }, { quoted: m })
            } else {
                await m.reply(
                    caption +
                    `\n⚠️ *${size}* supera el límite de ${MAX_MB}MB de WhatsApp.\n` +
                    `🔗 Descarga directa:\n${dl}`
                )
            }
            await m.react('⚠️')
        }

    } catch (e) {
        console.error('[APK ERROR]', e.message)
        await m.react('❌')
        m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝕻𝕶 〕══ ✠\n\n` +
            `⸸ No encontré *${query}*.\n` +
            `\`${e.message.slice(0, 200)}\`\n\n` +
            `_...verifica el nombre e intenta de nuevo._ 🕷️`
        )
    }
}

handler.help    = ['apk <nombre>']
handler.tags    = ['descargas']
handler.command = ['apk', 'apkdl', 'apkd', 'apks']

export default handler
