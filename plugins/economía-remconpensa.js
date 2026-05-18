// ═════════════════════════════════════════════════════════════════
// COMANDO: .recompensa 
// RUTA: plugins/owner-recompensa.js
// ═════════════════════════════════════════════════════════════════

import { database } from '../lib/database.js'

const handler = async (m, { conn, args, isOwner }) => {
    if (!database.data.users) database.data.users = {}
    const ejecutorJid = m.sender

    let target = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null)
    const numEjecutor = ejecutorJid.split('@')[0]

    if (isOwner) {
        let montoIndex = m.quoted ? 0 : 1
        let montoInput = args[montoIndex]

        if (!target || !montoInput) {
            return m.reply(`❌ Sintaxis incorrecta Owner.\n📌 Uso: .recompensa <@user o responder mensaje> <monto>`)
        }

        let cantidad = parseInt(montoInput)
        if (isNaN(cantidad) || cantidad <= 0) {
            return m.reply(`❌ El precio de la cabeza debe ser un número entero y mayor a cero.`)
        }

        if (!database.data.users[target]) {
            database.data.users[target] = {
                name: 'Usuario',
                eco: { dinero: 500, banco: 0, exp: 0, level: 1, posesiones: [], trabajos_realizados: 0, lastwork: 0 }
            }
        }

        const user = database.data.users[target]
        if (!user.eco) user.eco = { dinero: 500, banco: 0, exp: 0, level: 1, posesiones: [], trabajos_realizados: 0, lastwork: 0 }
        if (!user.eco.recompensa) user.eco.recompensa = 0

        user.eco.recompensa += cantidad
        await database.save()

        const numObjetivo = target.split('@')[0]
        const mensajeRecompensa = `
✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕭𝖔𝖚𝖓𝖙𝖞 〕══ ✠

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑶𝒓𝒅𝒆𝒓
🎯 Objetivo: @${numObjetivo}
💵 Precio base añadido: +$${cantidad} ${global.moneda}

📌 Botín Total Acumulado: $${user.eco.recompensa} ${global.moneda}
📢 NOTA: Los usuarios pueden reclamar este botín usando el comando: *.recompensa @user* o respondiendo a su mensaje.
_...orden de ejecución distribuida a la red._ 🕷️
        `.trim()

        return await conn.sendMessage(m.chat, { text: mensajeRecompensa, mentions: [target] }, { quoted: m })
    }

    if (!target) {
        return m.reply(`❌ Especifica el objetivo de tu cacería.\n📌 Uso: .recompensa <@user o responder mensaje>`)
    }

    if (target === ejecutorJid) {
        return m.reply(`❌ No puedes cobrar la recompensa por tu propia cabeza, fiera.`)
    }

    if (!database.data.users[target] || !database.data.users[target].eco || !database.data.users[target].eco.recompensa || database.data.users[target].eco.recompensa <= 0) {
        return m.reply(`❌ Ese usuario no tiene ninguna orden de caza activa ni recompensa sobre su cabeza.`)
    }

    if (!database.data.users[ejecutorJid]) {
        database.data.users[ejecutorJid] = {
            name: m.pushName || 'Usuario',
            eco: { dinero: 500, banco: 0, exp: 0, level: 1, posesiones: [], trabajos_realizados: 0, lastwork: 0 }
        }
    }

    const cazador = database.data.users[ejecutorJid]
    const objetivo = database.data.users[target]

    if (!cazador.eco) cazador.eco = { dinero: 500, banco: 0, exp: 0, level: 1, posesiones: [], trabajos_realizados: 0, lastwork: 0 }

    let probabilidadExito = 0.30
    let exito = Math.random() < probabilidadExito
    const numObjetivo = target.split('@')[0]

    if (!exito) {
        const mensajeFallo = `
✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕭𝖔𝖚𝖓𝖙𝖞 〕══ ✠

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑯𝒖𝒏𝒕 𝑭𝒂𝒊𝒍𝒆𝒅
⚔️ Operación: @${numEjecutor} intentó abatir a @${numObjetivo}.
🛡️ Resultado: El objetivo logró defenderse y escapar ileso.

📌 Botín Intacto: $${objetivo.eco.recompensa} ${global.moneda}
_...cacería fallida._ 🕷️
        `.trim()
        
        return await conn.sendMessage(m.chat, { text: mensajeFallo, mentions: [ejecutorJid, target] }, { quoted: m })
    }

    let botinCobrado = objetivo.eco.recompensa
    objetivo.eco.recompensa = 0
    cazador.eco.dinero += botinCobrado
    cazador.eco.exp += Math.floor(botinCobrado / 10)
    cazador.eco.level = Math.floor(cazador.eco.exp / 1000) + 1

    await database.save()

    const mensajeExito = `
✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕭𝖔𝖚𝖓𝖙𝖞 〕══ ✠

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑯𝒖𝒏𝒕 𝑺𝒖𝒄𝒄𝒆𝒔𝒔
⚔️ Operación: @${numEjecutor} abatió con éxito a @${numObjetivo}.
💵 Recompensa Reclamada: +$${botinCobrado} ${global.moneda}

📌 Cartera Cazador: $${cazador.eco.dinero} ${global.moneda} | Nivel: ${cazador.eco.level}
_...orden ejecutada y dada de baja de la red._ 🕷️
    `.trim()

    await conn.sendMessage(m.chat, { text: mensajeExito, mentions: [ejecutorJid, target] }, { quoted: m })
}

handler.help = ['recompensa <@user> [monto]']
handler.tags = ['economia']
handler.command = ['bounty', 'cazar', 'ejecutar']

export default handler
