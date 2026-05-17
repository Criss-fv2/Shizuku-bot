import { database } from '../lib/database.js'

const handler = async (m, { conn }) => {
    // 🔑 Obtener usuario
    if (!database.data.users) database.data.users = {}
    if (!database.data.users[m.sender]) {
        database.data.users[m.sender] = {
            name: m.pushName || 'Usuario',
            registered: false,
            eco: null  // Aquí guardaremos la economía
        }
    }

    const user = database.data.users[m.sender]

    // 🔑 Si no tiene economía, crear
    if (!user.eco) {
        user.eco = {
            dinero: 500,           // Dinero actual
            banco: 0,              // Dinero guardado
            exp: 0,                // Experiencia
            level: 1,              // Nivel
            posesiones: [],        // Items que tiene
            trabajos_realizados: 0, // Veces que trabajó
            lastwork: 0            // Última vez que trabajó
        }
    }

    // 🔑 Verificar cooldown (1 hora = 3600000 ms)
    const ahora = Date.now()
    const tiempoTranscurrido = ahora - user.eco.lastwork
    const unaHora = 3600000

    if (tiempoTranscurrido < unaHora) {
        const tiempoFaltante = Math.floor((unaHora - tiempoTranscurrido) / 60000)
        return m.reply(`⏳ Ya trabajaste hace poco.\n\nVuelve en ${tiempoFaltante} minutos.`)
    }

    // 🔑 TRABAJAR: Ganar dinero aleatorio
    const trabajos = [
        { nombre: '👨‍💼 Vendedor', min: 100, max: 250 },
        { nombre: '🍔 Cocinero', min: 80, max: 200 },
        { nombre: '🚗 Taxista', min: 150, max: 350 },
        { nombre: '📱 Programador', min: 200, max: 500 },
        { nombre: '🎮 Streamer', min: 50, max: 600 },
    ]

    const trabajoAleatorio = trabajos[Math.floor(Math.random() * trabajos.length)]
    const dineroGanado = Math.floor(Math.random() * (trabajoAleatorio.max - trabajoAleatorio.min + 1)) + trabajoAleatorio.min
    const expGanada = Math.floor(dineroGanado / 10)

    // 🔑 Actualizar economía
    user.eco.dinero += dineroGanado
    user.eco.exp += expGanada
    user.eco.trabajos_realizados += 1
    user.eco.lastwork = ahora

    // 🔑 Subir de nivel cada 1000 exp
    user.eco.level = Math.floor(user.eco.exp / 1000) + 1

    // 🔑 Guardar en BD
    await database.save()

    // 🔑 Responder
    m.reply(`
╭─────────────────────────╮
│       💼 TRABAJO        │
╰─────────────────────────╯

${trabajoAleatorio.nombre}

💵 Ganaste: +${dineroGanado} Nen
⭐ Exp: +${expGanada}

💰 Dinero: ${user.eco.dinero} Nen
📊 Nivel: ${user.eco.level}
✅ Trabajos: ${user.eco.trabajos_realizados}
`)
}

handler.help = ['work']
handler.tags = ['economia']
handler.command = ['work', 'trabajar', 'labor']

export default handler
