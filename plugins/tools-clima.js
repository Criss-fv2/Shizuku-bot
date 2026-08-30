import fetch from 'node-fetch'

let handler = async (m, { args }) => {
    let ciudad = args.join(' ').trim()
    if (!ciudad) {
        await m.react('🌸')
        return m.reply('💗 Escribe el nombre de la ciudad después del comando darling\~\nEjemplo: *#clima Medellín*')
    }

    await m.react('🍬')

    try {
        // Usamos wttr.in (rápido, gratis y sin API key)
        const url = `https://wttr.in/${encodeURIComponent(ciudad)}?format=%C+%t\nViento:+%w\nHumedad:+%h\nPresión:+%P`
        const res = await fetch(url)
        const data = await res.text()

        const texto = `💗 *Clima en ${ciudad.toUpperCase()}* 🌸\n\n` +
                      `${data}\n\n` +
                      `¡Zero Two te desea un lindo día darling\~! 💕`

        await m.reply(texto)
        await m.react('💗')

    } catch (e) {
        console.error(e)
        await m.react('💔')
        m.reply('💔 Uy darling... no pude obtener el clima de esa ciudad\~\nPrueba con otro nombre')
    }
}

handler.help = ['clima <ciudad>']
handler.tags = ['tools']
handler.command = ['clima', 'weather']

export default handler