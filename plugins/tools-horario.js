let handler = async (m) => {
    await m.react('🍬')

    const now = new Date()

    const zonas = [
        { name: 'Colombia (Medellín)', tz: 'America/Bogota' },
        { name: 'España (Madrid)', tz: 'Europe/Madrid' },
        { name: 'México (CDMX)', tz: 'America/Mexico_City' },
        { name: 'Argentina (Buenos Aires)', tz: 'America/Argentina/Buenos_Aires' },
        { name: 'EEUU (Miami)', tz: 'America/New_York' }
    ]

    let texto = `💗 *HORA ACTUAL EN DIFERENTES ZONAS* 🌸\n\n`

    zonas.forEach(z => {
        const hora = now.toLocaleTimeString('es-ES', { 
            timeZone: z.tz, 
            hour12: false 
        })
        texto += `🕒 *${z.name}:* ${hora}\n`
    })

    texto += `\n¡Zero Two siempre está despierta contigo darling\~! 💕`

    return m.reply(texto)
}

handler.help = ['horario', 'hora']
handler.tags = ['tools', 'main']
handler.command = ['horario', 'hora', 'time', 'times']

export default handler