// ═════════════════════════════════════════════════════════════════
// COMANDO: .banco (Depositar y Retirar)
// RUTA: plugins/economia-banco.js
// ═════════════════════════════════════════════════════════════════

import { database } from '../lib/database.js'

const handler = async (m, { args }) => {
    if (!database.data.users) database.data.users = {}
    const jid = m.sender

    if (!database.data.users[jid]) {
        return m.reply('⏳ No registras operaciones en la red. Usa el comando de trabajo primero. 🕷️')
    }

    const user = database.data.users[jid]
    if (!user.eco) {
        user.eco = { dinero: 500, banco: 0, exp: 0, level: 1, posesiones: [], trabajos_realizados: 0, lastwork: 0 }
    }

    const accion = args[0]?.toLowerCase()
    let cantidadInput = args[1]
    let cantidad = 0

    if (accion === 'depositar' || accion === 'dep') {
        if (cantidadInput === 'all' || cantidadInput === 'todo') {
            cantidad = user.eco.dinero
        } else {
            cantidad = parseInt(cantidadInput)
        }

        if (!cantidad || cantidad < 50) {
            return m.reply('❌ El monto mínimo para ingresar a las bóvedas es de $50 ${global.moneda}.\n📌 Uso: .banco dep <cantidad/all>')
        }

        if (cantidad > user.eco.dinero) {
            return m.reply(`❌ Fondos insuficientes en mano. Cuentas con: $${user.eco.dinero} ${global.moneda}`)
        }

        user.eco.dinero -= cantidad
        user.eco.banco += cantidad
        await database.save()

        const mDep = `
✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕭𝖆𝖓𝖐 〕══ ✠

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑫𝒆𝒑𝒐𝒔𝒊𝒕
📥 Transacción: Fondos resguardados con éxito.
💵 Ingreso: +$${cantidad} ${global.moneda}

📌 Bóveda: $${user.eco.banco} ${global.moneda} | Cartera: $${user.eco.dinero} ${global.moneda}
_...bóveda encriptada._ 🕷️
        `.trim()
        return m.reply(mDep)
    }

    if (accion === 'retirar' || accion === 'ret') {
        if (cantidadInput === 'all' || cantidadInput === 'todo') {
            cantidad = user.eco.banco
        } else {
            cantidad = parseInt(cantidadInput)
        }

        if (!cantidad || cantidad < 50) {
            return m.reply('❌ El retiro mínimo de las bóvedas es de $50 Nen.\n📌 Uso: .banco ret <cantidad/all>')
        }

        if (cantidad > user.eco.banco) {
            return m.reply(`❌ Fondos insuficientes en bóveda. Cuentas con: $${user.eco.banco} ${global.moneda}`)
        }

        user.eco.banco -= cantidad
        user.eco.dinero += cantidad
        await database.save()

        const mRet = `
✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕭𝖆𝖓𝖐 〕══ ✠

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑾𝒊𝒕𝒉𝒅𝒓𝒂𝑾
📤 Transacción: Fondos retirados con éxito.
💵 Retiro: +$${cantidad} Nen

📌 Bóveda: $${user.eco.banco} ${global.moneda} | Cartera: $${user.eco.dinero} ${global.moneda}
_...efectivo en mano._ 🕷️
        `.trim()
        return m.reply(mRet)
    }

    const mSaldo = `
✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝒌𝖚 𝕭𝖆𝖓𝖐 〕══ ✠

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑩𝒂𝒍𝒂𝒏𝒄𝒆
💵 Cartera: $${user.eco.dinero} Nen
🏦 Bóveda: $${user.eco.banco} Nen
💰 Total Neto: $${user.eco.dinero + user.eco.banco} ${global.moneda}

🔏 Operaciones rápidas:
• .banco dep <monto/all>
• .banco ret <monto/all>
_...terminal lista._ 🕷️
    `.trim()
    
    m.reply(mSaldo)
}

handler.help = ['banco']
handler.tags = ['economia']
handler.command = ['banco', 'bank', 'boveda']
handler.register = true

export default handler

