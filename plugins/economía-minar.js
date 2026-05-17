import { database } from '../lib/database.js'

const handler = async (m, { conn }) => {
    if (!database.data.users) database.data.users = {}
    if (!database.data.users[m.sender]) {
        database.data.users[m.sender] = {
            name: m.pushName || 'Usuario',
            eco: {
                dinero: 500,
                banco: 0,
                exp: 0,
                level: 1,
                posesiones: [],
                trabajos_realizados: 0,
                lastwork: 0,
                lastmine: 0
            }
        }
    }

    const user = database.data.users[m.sender]
    if (!user.eco) user.eco = { dinero: 500, banco: 0, exp: 0, level: 1, posesiones: [], trabajos_realizados: 0, lastwork: 0, lastmine: 0 }

    // 🔑 Verificar cooldown (2 horas)
    const ahora = Date.now()
    const tiempoTranscurrido = ahora - user.eco.lastmine
    const dosHoras = 7200000

    if (tiempoTranscurrido < dosHoras) {
        const tiempoFaltante = Math.floor((dosHoras - tiempoTranscurrido) / 60000)
        return m.reply(`⏳ La mina está cerrada.\n\nVuelve en ${tiempoFaltante} minutos.`)
    }

    // 🔑 MINAR: Ganar dinero minando
    const minerales = [
        { nombre: '💎 Diamante', probabilidad: 0.1, dinero: 1000 },
        { nombre: '🥇 Oro', probabilidad: 0.2, dinero: 500 },
        { nombre: '🪨 Piedra', probabilidad: 0.4, dinero: 100 },
        { nombre: '💥 Explosión', probabilidad: 0.2, dinero: -100 },
        { nombre: '🕳️ Derrumbe', probabilidad: 0.1, dinero: 0 },
    ]

    let r = Math.random()
    let acc = 0
    let mineralEncontrado = minerales[2]

    for (const mineral of minerales) {
        acc += mineral.probabilidad
        if (r < acc) {
            mineralEncontrado = mineral
            break
        }
    }

    // 🔑 Actualizar dinero
    user.eco.dinero += mineralEncontrado.dinero
    user.eco.exp += Math.abs(mineralEncontrado.dinero) / 10
    user.eco.lastmine = ahora
    user.eco.level = Math.floor(user.eco.exp / 1000) + 1

    await database.save()

    m.reply(`
╭─────────────────────────╮
│      ⛏️ MINERÍA         │
╰─────────────────────────╯

${mineralEncontrado.nombre}

${mineralEncontrado.dinero >= 0 ? '✅ Ganaste: +' : '❌ Perdiste: '}${Math.abs(mineralEncontrado.dinero)} Nen

💰 Dinero: ${user.eco.dinero} Nen
📊 Nivel: ${user.eco.level}
`)
}

handler.help = ['minar']
handler.tags = ['economia']
handler.command = ['minar', 'mine', 'mineria']

export default handler
