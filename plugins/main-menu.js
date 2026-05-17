import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import fetch from 'node-fetch'
import {
    proto,
    prepareWAMessageMedia,
    generateWAMessageFromContent
} from '@whiskeysockets/baileys'
import { database } from '../lib/database.js'

// Función para calcular el tiempo activo
function formatUptime(seconds) {
    let d = Math.floor(seconds / (3600 * 24))
    let h = Math.floor((seconds % (3600 * 24)) / 3600)
    let m = Math.floor((seconds % 3600) / 60)
    let s = Math.floor(seconds % 60)

    return `${d}d ${h}h ${m}m ${s}s`
}

async function getBuffer(url) {
    const res = await fetch(url)

    if (!res.ok) {
        throw new Error(`Error descargando ${url}: ${res.status}`)
    }

    return Buffer.from(await res.arrayBuffer())
}

// Thumbnail corregida tipo banner compacto
async function resizeThumbnail(buffer) {
    try {
        const jimpModule = await import('jimp')
        const Jimp = jimpModule.Jimp || jimpModule.default

        const img = await Jimp.read(buffer)

        // Compacto tipo menú Choso pero compatible con WhatsApp
        if (typeof img.cover === 'function') {
            img.cover(400, 180)
        } else {
            img.resize(400, 180)
        }

        if (typeof img.quality === 'function') {
            img.quality(85)
        }

        if (typeof img.getBufferAsync === 'function') {
            return await img.getBufferAsync('image/jpeg')
        }

        return await img.getBuffer('image/jpeg')
    } catch (e) {
        console.warn(
            'No se pudo redimensionar thumbnail:',
            e.message
        )
        return buffer
    }
}

const handler = async (m, { conn }) => {
    try {
        const botname =
            global.botname ||
            global.botName ||
            'Shizuku'

        const pluginDir =
            path.resolve('./plugins')

        const pluginFiles = fs
            .readdirSync(pluginDir)
            .filter(file =>
                file.endsWith('.js')
            )

        const grouped = {}

        for (const file of pluginFiles) {
            try {
                const filePath = path.join(
                    pluginDir,
                    file
                )

                const plugin = (
                    await import(
                        `${pathToFileURL(filePath).href}?update=${Date.now()}`
                    )
                ).default

                const tags =
                    plugin?.tags || ['misc']

                const commands =
                    Array.isArray(
                        plugin?.command
                    )
                        ? plugin.command
                        : plugin?.command
                        ? [plugin.command]
                        : [
                              file.replace(
                                  '.js',
                                  ''
                              )
                          ]

                const cmd = commands[0]

                for (const tag of tags) {
                    if (!grouped[tag])
                        grouped[tag] = []

                    grouped[tag].push(cmd)
                }
            } catch {
                const cmd = file.replace(
                    '.js',
                    ''
                )

                if (!grouped.misc)
                    grouped.misc = []

                grouped.misc.push(cmd)
            }
        }

        const totalCmds =
            Object.values(grouped)
                .flat().length

        const users =
            database?.data?.users || {}

        const totalUsers =
            Object.keys(users).length

        const registeredUsers =
            Object.values(users).filter(
                u => u?.registered
            ).length

        const zonaHoraria =
            'America/Tijuana'

        const ahora = new Date()

        const horaExacta =
            ahora.toLocaleTimeString(
                'es-MX',
                {
                    timeZone:
                        zonaHoraria,
                    hour: '2-digit',
                    minute: '2-digit',
                    second:
                        '2-digit',
                    hour12: true
                }
            )

        const uptimeStr =
            formatUptime(
                process.uptime()
            )

        const hora = parseInt(
            ahora.toLocaleTimeString(
                'es-MX',
                {
                    timeZone:
                        zonaHoraria,
                    hour: '2-digit',
                    hour12: false
                }
            )
        )

        let saludo

        if (hora >= 5 && hora < 12) {
            saludo =
                '...buenos días, supongo.'
        } else if (
            hora >= 12 &&
            hora < 18
        ) {
            saludo =
                '...buenas tardes. o algo así.'
        } else {
            saludo =
                '...buenas noches. ¿por qué sigues despierto?'
        }

        const frases = [
            'no recuerdo haberte invitado, pero aquí estás.',
            'blinky podría encargarse de esto, pero supongo que yo también.',
            'no sé quién eres, pero el sistema sí.',
            '...¿necesitas algo o solo viniste a curiosear?',
            'el nen no miente. los comandos tampoco.'
        ]

        const frase =
            frases[
                Math.floor(
                    Math.random() *
                        frases.length
                )
            ]

        const seccionesTexto =
            Object.entries(
                grouped
            )
                .map(
                    ([tag, cmds]) => {
                        return `꧁ · ${tag.toUpperCase()} · ꧂\n${cmds
                            .map(
                                c =>
                                    `  ⸸ ${c}`
                            )
                            .join(
                                '\n'
                            )}`
                    }
                )
                .join('\n\n')

        const menuTexto = `
✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒 〕══ ✠

_${saludo}_
*${m.pushName || 'Usuario'}*... ${frase}

 ✠ ───────────────── ✠
 ⸸ *Hora (TJ):* ${horaExacta}
 ⸸ *Activo:* ${uptimeStr}
 ✠ ───────────────── ✠

⸸ *Comandos activos:* ${totalCmds}
⸸ *Usuarios registrados:* ${registeredUsers}
⸸ *Entidades conocidas:* ${totalUsers}

✠ ───────────────── ✠

${seccionesTexto}

✠ ───────────────── ✠
_— ${botname} · Araña Nº8 · no me molestes si no es urgente_ 🕷️
`.trim()

        const thumbUrl =
            'https://files.catbox.moe/y47iw7.jpg'

        const thumbOriginal =
            await getBuffer(
                thumbUrl
            )

        const thumbResized =
            await resizeThumbnail(
                thumbOriginal
            )

        const fakeDocument =
            Buffer.from(
                menuTexto,
                'utf-8'
            )

        const prepared =
            await prepareWAMessageMedia(
                {
                    document:
                        fakeDocument,
                    mimetype:
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    fileName:
                        '🕷 Shizuku System.xlsx'
                },
                {
                    upload:
                        conn.waUploadToServer
                }
            )

        const documentMessage =
            prepared.documentMessage

        documentMessage.fileName =
            '🕷 Shizuku System.xlsx'

        documentMessage.title =
            '🕷 Shizuku System'

        documentMessage.caption =
            menuTexto

        documentMessage.mimetype =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

        documentMessage.pageCount = 0

        documentMessage.jpegThumbnail =
            thumbResized

        // Banner compacto visible
        documentMessage.thumbnailWidth = 400
        documentMessage.thumbnailHeight = 180

        const waMsg =
            generateWAMessageFromContent(
                m.chat,
                {
                    documentMessage:
                        proto.Message.DocumentMessage.fromObject(
                            documentMessage
                        )
                },
                {
                    userJid:
                        conn.user?.id
                }
            )

        await conn.relayMessage(
            m.chat,
            waMsg.message,
            {
                messageId:
                    waMsg.key.id
            }
        )
    } catch (e) {
        console.error(e)

        await m.reply(
            '...algo falló. blinky tampoco lo entendió.'
        )
    }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = [
    'menu',
    'help',
    'ayuda'
]

export default handler