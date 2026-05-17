let handler = async (m, { conn, args, prefix, command }) => {
    // Definimos la misma base de datos aquí (o la compartimos vía settings.js)
    const peliculasData = {
        '1': { 
            nombre: 'Blancanieves y los siete enanitos', 
            año: '1937',
            // ¡IMPORTANTE! Reemplaza esto con el link real a tu video darling~!
            video_url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4' 
        },
        '2': { 
            nombre: 'Frozen: El reino del hielo', 
            año: '2013',
            // ¡IMPORTANTE! Reemplaza esto con el link real a tu video darling~!
            video_url: 'https://www.w3schools.com/html/mov_bbb.mp4'
        },
        '3': { 
            nombre: 'Cenicienta', 
            año: '1950',
            // ¡IMPORTANTE! Reemplaza esto con el link real a tu video darling~!
            video_url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4' 
        }
    }

    // 1. Validamos que haya puesto el número
    if (!args[0]) {
        return m.reply(`✦ 𝓩𝓮𝓻𝓸 𝓣𝔀𝓸\n\n⚠️ Te faltó el número de la película darling.\nEjemplo: *${prefix + command} 1*`)
    }

    const movieNumber = args[0]
    const movie = peliculasData[movieNumber]

    // 2. Validamos que la película exista
    if (!movie) {
        return m.reply(`✦ 𝓩𝓮𝓻𝓸 𝓣𝔀𝓸\n\n⚠️ El número *${movieNumber}* no está en mi catálogo. Usa *${prefix}peliculas* para ver la lista darling~`)
    }

    // 3. Confirmamos que vamos a enviar la película
    await m.reply(`✦ 𝓩𝓮𝓻𝓸 𝓣𝔀𝓸\n\n🎥 *Procesando...*\n\n» Película: ${movie.nombre}\n\nEspérame un momento mientras preparo la proyección darling~`)
    await m.react('⏳')

    // 4. Enviamos el video completo
    try {
        await conn.sendMessage(m.chat, {
            video: { url: movie.video_url },
            caption: `✦ 𝓩𝓮𝓻𝓸 𝓣𝔀𝓸 · 𝓒𝓲𝓷𝓮𝓶𝓪\n\n🍿 ¡Aquí tienes tu película darling!\n\n» *${movie.nombre} (${movie.año})*`,
            fileName: `${movie.nombre}.mp4`,
            mimetype: 'video/mp4'
        }, { quoted: m })

        await m.react('🍿')
    } catch (e) {
        console.error('Error enviando película:', e)
        m.reply('⚠️ Lo siento darling, hubo un error al enviar la película. Es posible que el enlace del video esté caído.')
        await m.react('❌')
    }
}

handler.help = ['ver [número]']
handler.tags = ['cine']
handler.command = ['ver', 'watch']
handler.group = true

export default handler
