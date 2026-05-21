import fs from 'fs'
import path from 'path'

let handler = async (m, { conn }) => {
    try {
        await m.react('🕷')

        const pluginsDir = './plugins'
        const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'))

        let errores = []

        for (const file of files) {
            try {
                await import(`${path.resolve(pluginsDir, file)}?t=${Date.now()}`)
            } catch (error) {
                const stackLines = error.stack?.split('\n') || []
                let linea = '?'
                for (const l of stackLines) {
                    const match = l.match(/:(\d+):\d+\)/)
                    if (match) { linea = match[1]; break }
                }
                errores.push({ file, mensaje: error.message?.slice(0, 120), linea })
            }
        }

        const total = files.length
        const totalErrores = errores.length
        const limpios = total - totalErrores

        if (totalErrores === 0) {
            const response =
                `🕷 *${global.botTag}*\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `🕸 *Diagnóstico completado*\n\n` +
                `🕷 Archivos revisados: *${total}*\n` +
                `🕸 Errores encontrados: *0*\n` +
                `🕷 Estado: *Todo en orden*\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `${global.dev}`

            await m.reply(response)
            await m.react('🕸')
        } else {
            let response =
                `🕷 *${global.botTag}*\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `🕸 *Diagnóstico completado*\n\n` +
                `🕷 Archivos revisados: *${total}*\n` +
                `🕸 Sin errores: *${limpios}*\n` +
                `🕷 Con errores: *${totalErrores}*\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n\n`

            for (const e of errores) {
                response +=
                    `🕷 *${e.file}*\n` +
                    `🕸 Línea: *${e.linea}*\n` +
                    `🕸 Error: \`${e.mensaje}\`\n` +
                    `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n`
            }

            response += `\n${global.dev}`

            await m.reply(response)
            await m.react('🕷')
        }

    } catch (err) {
        await m.react('🕷')
        await m.reply(
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 Error al ejecutar diagnóstico\n` +
            `\`${err.message?.slice(0, 200)}\`\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.dev}`
        )
    }
}

handler.command = ['detectar', 'detectarsyntax', 'checksyntax']
handler.help = ['detectar']
handler.tags = ['owner']
handler.owner = true

export default handler
