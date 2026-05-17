let handler = async (m, { conn, prefix, command }) => {
    // Definimos las películas aquí para que sea un ejemplo autónomo.
    // Lo ideal es tener esto en global.moviesData o settings.js.
    const peliculasData = {
        '1': { 
            nombre: 'Blancanieves y los siete enanitos', 
            año: '1937',
            genero: 'Animación'
        },
        '2': { 
            nombre: 'Frozen: El reino del hielo', 
            año: '2013',
            genero: 'Fantasía'
        },
        '3': { 
            nombre: 'Cenicienta', 
            año: '1950',
            genero: 'Clásico'
        }
    }

    // 1. URL de la imagen compuesta (el 'póster gigante')
    // ¡Asegúrate de cambiar esta URL por tu catálogo real darling~!
    const catalogoVisual = 'https://i.pinimg.com/736x/21/cd/11/21cd11726c04fdf89e1a8bb1611ec5a4.jpg'

    // 2. Construimos la lista de texto
    let textoLista = `✦ 𝓩𝓮𝓻𝓸 𝓣𝔀𝓸 · 𝓒𝓲𝓷𝓮𝓶𝓪\n\n`
    textoLista += `🎬 Películas Clásicas Disponibles:\n\n`

    Object.entries(peliculasData).forEach(([number, movie]) => {
        textoLista += `✧ [${number}] ${movie.nombre} (${movie.año})\n`
    })

    textoLista += `\n› Usa: *${prefix}ver [número]* para que te envíe la película completa darling~`

    // 3. Enviamos el mensaje con el visual y la lista
    await conn.sendMessage(m.chat, {
        image: { url: catalogoVisual },
        caption: textoLista
    }, { quoted: m })

    // Reacción final
    await m.react('🎬')
}

handler.help = ['peliculas', 'cine']
handler.tags = ['cine']
handler.command = ['peliculas', 'cine', 'classic']
handler.group = true

export default handler
