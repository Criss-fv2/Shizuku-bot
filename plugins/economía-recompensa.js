// ═════════════════════════════════════════════════════════════════
// COMANDOS: .pagar / .cazar 
// RUTA: plugins/economia-recompensa.js
// ═════════════════════════════════════════════════════════════════

import { database } from '../lib/database.js'

const handler = async (m, { conn, args, isOwner, command }) => {
    if (!database.data.users) database.data.users = {}
    const ejecutorJid = m.sender

    // 🕸️ Detección del objetivo por mención o respuesta a mensaje
    let target = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null)

    // ──────────────────────────────────────────
    // 🩸 COMANDO: .PAGAR 
    // ──────────────────────────────────────────
    if (command === 'pagar') {
        if (!isOwner) return m.reply('❌ Acceso denegado. Solo la autoridad principal puede autorizar este pago de alto secreto. 🕷️')

        let montoIndex = m.quoted ? 0 : 1
        let montoInput = args[montoIndex]

        if (!target || !montoInput) {
            return m.reply(`❌ Sintaxis incorrecta Owner.\n📌 Uso: .pagar <@user o responder mensaje> <monto>`)
        }

        let cantidad = parseInt(montoInput)
        if (isNaN(cantidad) || cantidad <= 0) {
            return m.reply(`❌ El monto de la operación debe ser un número entero y mayor a cero.`)
        }

        if (!database.data.users[target]) {
            database.data.users[target] = { name: 'Usuario', eco: { dinero: 500, banco: 0, exp: 0, level: 1, posesiones: [], trabajos_realizados: 0, lastwork: 0 } }
        }

        const user = database.data.users[target]
        if (!user.eco) user.eco = { dinero: 500, banco: 0, exp: 0, level: 1, posesiones: [], trabajos_realizados: 0, lastwork: 0 }
        
      
        if (!user.eco.recompensa) user.eco.recompensa = 0

        
        user.eco.recompensa += cantidad
        await database.save()

        const numObjetivo = target.split('@')[0]
        const formattedAmount = cantidad.toLocaleString('es-CO')

        const mensajePagar = `
[𝕾𝖍𝖎𝖟𝖚𝖐𝖚] 𝕭𝖔𝖚𝖓𝖙𝖞 

🎯 *Objetivo:* @${numObjetivo}
💵 *Secreto de Pago:* +$${formattedAmount} ${global.moneda} 

*El cartel pagó $${formattedAmount} ${global.moneda} por tu cabeza.*
_...vigila tus espaldas._ 🕷️
        `.trim()

        return await conn.sendMessage(m.chat, { text: mensajePagar, mentions: [target] }, { quoted: m })
    }

    // ──────────────────────────────────────────
    // ⚔️ COMANDO: .CAZAR (CUALQUIER USUARIO )
    // ──────────────────────────────────────────
    if (command === 'cazar') {
        if (!target) {
            return m.reply(`❌ Especifica el objetivo de tu caza.\n📌 Uso: .cazar <@user> (etiquetando a la víctima)`)
        }

        if (target === ejecutorJid) {
            return m.reply(`❌ No puedes reclamar tu propia cabeza, fiera. Tienes que ser un cazador.`)
        }

        // Si el objetivo no tiene recompensa mayor a cero, la cacería se bloquea
        if (!database.data.users[target] || !database.data.users[target].eco || !database.data.users[target].eco.recompensa || database.data.users[target].eco.recompensa <= 0) {
            return m.reply(`❌ Ese usuario no tiene ninguna orden de caza activa ni recompensa sobre su cabeza. Está limpio.`)
        }

        if (!database.data.users[ejecutorJid]) {
            database.data.users[ejecutorJid] = { name: m.pushName || 'Usuario', eco: { dinero: 500, banco: 0, exp: 0, level: 1, posesiones: [], trabajos_realizados: 0, lastwork: 0 } }
        }

        const cazador = database.data.users[ejecutorJid]
        const objetivo = database.data.users[target]

        if (!cazador.eco) cazador.eco = { dinero: 500, banco: 0, exp: 0, level: 1, posesiones: [], trabajos_realizados: 0, lastwork: 0 }

        
        const numObjetivo = target.split('@')[0]
        const numCazador = ejecutorJid.split('@')[0]
        let botinCobrado = objetivo.eco.recompensa

        
        objetivo.eco.recompensa = 0 
        
        cazador.eco.dinero += botinCobrado
        cazador.eco.exp += Math.floor(botinCobrado / 10)
        cazador.eco.level = Math.floor(cazador.eco.exp / 1000) + 1

        await database.save()

        const formattedCartera = cazador.eco.dinero.toLocaleString('es-CO')
        const formattedCobrado = botinCobrado.toLocaleString('es-CO')

        const mensajeExito = `
[𝕾𝖍𝖎𝖟𝖚𝖐𝖚] 𝕭𝖔𝖚𝖓𝖙𝖞 

🕸️ *𝕾𝖍𝖎𝖟𝖚𝖐𝖚 Operación Exitosa*
⚔️ @${numCazador} abatió con éxito a @${numObjetivo}.

*Te deshiciste de la amenaza y el cartel te pagó $${formattedCobrado} ${global.moneda}.*

📌 *Cartera Cazador:* $${formattedCartera} ${global.moneda} | Rango: Nivel ${cazador.eco.level}
_...orden ejecutada y dada de baja de la red._ 🕷️
        `.trim()

        return await conn.sendMessage(m.chat, { text: mensajeExito, mentions: [ejecutorJid, target] }, { quoted: m })
    }
}

handler.help = ['pagar <@user> <monto>', 'cazar <@user>']
handler.tags = ['economia']
handler.command = ['pagar', 'cazar'] 

export default handler
