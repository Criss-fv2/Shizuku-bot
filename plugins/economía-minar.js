// ═════════════════════════════════════════════════════════════════
// RUTA: plugins/economia-minar.js
// ═════════════════════════════════════════════════════════════════

import { database } from '../lib/database.js'

const handler = async (m, { conn }) => {
    if (!database.data.users) database.data.users = {}
    const jid = m.sender

    if (!database.data.users[jid]) {
        database.data.users[jid] = {
            name: m.pushName || 'Usuario',
            eco: { dinero: 500, banco: 0, exp: 0, level: 1, posesiones: [], trabajos_realizados: 0, lastwork: 0, lastmine: 0 }
        }
    }

    const user = database.data.users[jid]
    if (!user.eco) user.eco = { dinero: 500, banco: 0, exp: 0, level: 1, posesiones: [], trabajos_realizados: 0, lastwork: 0, lastmine: 0 }

    const ahora = Date.now()
    const tiempoTranscurrido = ahora - user.eco.lastmine
    const dosHoras = 5 * 60 * 1000

    if (tiempoTranscurrido < dosHoras && user.eco.lastmine !== 0) {
        const tiempoFaltante = dosHoras - tiempoTranscurrido
        const horas = Math.floor(tiempoFaltante / (60 * 60 * 1000))
        const minutos = Math.floor((tiempoFaltante % (60 * 60 * 1000)) / (60 * 1000))
        
        return m.reply(`⏳ Los túneles están colapsados mi amor. Regresa en *${horas}h ${minutos}m* para excavar de nuevo. 🕷️`)
    }

    const poolMinerales = [
        { 
            tipo: '💎 Diamante', 
            probabilidad: 0.1, 
            dinero: 1200, 
            frases: ["un Diamante de Sangre puro", "una Esmeralda ancestral en bruto", "un Cristal de Litio de contrabando"] 
        },
        { 
            tipo: '🥇 Oro', 
            probabilidad: 0.2, 
            dinero: 600, 
            frases: ["un lingote de Oro de 24K", "una veta de Plata pura", "unas pepitas de Platino brillante"] 
        },
        { 
            tipo: '🪨 Piedra', 
            probabilidad: 0.4, 
            dinero: 150, 
            frases: ["unos trozos de Carbón húmedo", "un pedazo de Cobre oxidado", "mucha Piedra caliza sin valor"] 
        },
        { 
            tipo: '💥 Explosión', 
            probabilidad: 0.2, 
            dinero: -200, 
            frases: ["un viejo Tanque de Gasolina abandonado", "una mina antipersona activa", "un cartucho defectuoso de Dinamita"] 
        },
        { 
            tipo: '🕳️ Derrumbe', 
            probabilidad: 0.1, 
            dinero: 0, 
            frases: ["un colapso total en la sección B-12", "una fuga de gas tóxico", "una inundación de aguas negras"] 
        }
    ]

    let r = Math.random()
    let acc = 0
    let seleccionado = poolMinerales[2]

    for (const mineral of poolMinerales) {
        acc += mineral.probabilidad
        if (r < acc) {
            seleccionado = mineral
            break
        }
    }

    const detalleMineral = seleccionado.frases[Math.floor(Math.random() * seleccionado.frases.length)]

    let esCritico = false
    let dineroFinal = seleccionado.dinero
    if (dineroFinal > 0 && Math.random() < 0.15) {
        dineroFinal *= 2
        esCritico = true
    }

    user.eco.dinero += dineroFinal
    if (user.eco.dinero < 0) user.eco.dinero = 0
    
    user.eco.exp += Math.floor(Math.abs(dineroFinal) / 10)
    user.eco.lastmine = ahora
    user.eco.level = Math.floor(user.eco.exp / 1000) + 1

    await database.save()

    let balanceTexto = dineroFinal > 0 
        ? `💵 Ganancia: +$${dineroFinal} ${global.moneda}` 
        : dineroFinal < 0 
            ? `📉 Pérdida: -$${Math.abs(dineroFinal)} ${global.moneda}` 
            : `⚖️ Balance: $0 ${global.moneda}`

    const mensajeMine = `
✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕸𝖎𝖓𝖎𝖓𝖌 〕══ ✠

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑬𝒙𝒄𝒂𝒗𝒂𝒕𝒊𝒐𝒏
🛠️ Excavación: Encontraste ${detalleMineral}.${esCritico ? ' ¡CRÍTICO! 🔥' : ''}
${balanceTexto}

 Cartera: $${user.eco.dinero} Nen | Nivel: ${user.eco.level}

_...sistema actualizado, túneles bloqueados por 5 minutos._ 🕷️
    `.trim()

    await conn.sendMessage(m.chat, { text: mensajeMine }, { quoted: m })
}

handler.help = ['minar']
handler.tags = ['economia']
handler.command = ['minar', 'mine', 'mineria', 'chambear_mina']
handler.register = true

export default handler
