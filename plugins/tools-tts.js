import fetch from 'node-fetch'

let handler = async (m, { args }) => {
    let texto = args.join(' ').trim()
    if (!texto) {
        await m.react('🌸')
        return m.reply('💗 Escribe algo después del comando darling\~\nEjemplo: *#tts Hola Zero Two, te extraño mucho*')
    }

    // Limitar texto para evitar errores
    if (texto.length > 200) {
        await m.react('💔')
        return m.reply('💔 El texto es muy largo darling\~ máximo 200 caracteres')
    }

    await m.react('🍬')

    try {
        const url = `https://api.fgmods.xyz/api/tts?text=${encodeURIComponent(texto)}&language=es`
        const res = await fetch(url)
        const json = await res.json()

        if (!json.result) throw new Error('No se generó audio')

        await conn.sendMessage(m.chat, {
            audio: { url: json.result },
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: m })

        await m.react('💗')

    } catch (e) {
        console.error('TTS ERROR:', e)
        await m.react('💔')
        m.reply('💔 Uy darling... la voz falló esta vez\~\nPrueba con texto más corto o inténtalo de nuevo')
    }
}

handler.help = ['tts <texto>']
handler.tags = ['tools']
handler.command = ['tts']

export default handler