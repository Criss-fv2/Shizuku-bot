import syntaxerror from 'syntax-error'
import { format } from 'util'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createRequire } from 'module'
import { database } from '../lib/database.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(__dirname)

let handler = async (m, { conn, args }) => {
    const _body = args.join(' ')

    if (!_body) return m.reply(
        `🕷 *${global.botTag}*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `🕸 Ingresa el código a evaluar\n` +
        `🕷 Ejemplo: *${global.prefix}e 1 + 1*\n` +
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
        `${global.author}`
    )

    await m.react('🕷')

    const _text = (/^return\s/.test(_body) ? '' : 'return ') + _body
    let _return
    let _syntax = ''

    try {
        let i = 15
        let f = { exports: {} }
        let exec = new (async () => {}).constructor(
            'print', 'm', 'handler', 'require', 'conn',
            'Array', 'process', 'args', 'module', 'exports', 'argument', 'db',
            _text
        )
        _return = await exec.call(
            conn,
            (...a) => {
                if (--i < 1) return
                console.log(...a)
                return m.reply(format(...a))
            },
            m, handler, require, conn,
            CustomArray, process, args,
            f, f.exports, [conn], database.data
        )
        await m.react('🕸')
    } catch (e) {
        let err = syntaxerror(_text, 'Execution Function', {
            allowReturnOutsideFunction: true,
            allowAwaitOutsideFunction: true,
            sourceType: 'module'
        })
        if (err) _syntax = `🕷 *${global.botTag}*\n┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n🕸 *Error de sintaxis:*\n\`\`\`${err}\`\`\`\n┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n\n`
        _return = e
        await m.react('🕷')
    } finally {
        const resultado = format(_return)
        await m.reply(
            _syntax ||
            `🕷 *${global.botTag}*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `🕸 *Resultado:*\n\`\`\`${resultado.slice(0, 3000)}\`\`\`\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `${global.author}`
        )
    }
}

handler.help = ['e <código>']
handler.tags = ['owner']
handler.command = ['e']
handler.owner = true

export default handler

class CustomArray extends Array {
    constructor(...args) {
        if (typeof args[0] === 'number') return super(Math.min(args[0], 10000))
        else return super(...args)
    }
}
