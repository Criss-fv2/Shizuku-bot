import { database } from '../lib/database.js'

const handler = async (m, { args }) => {
    if (!database.data.users) database.data.users = {}
    if (!database.data.users[m.sender]) {
        return m.reply('⚠️ Debes usar .work primero para crear tu cuenta.')
    }

    const user = database.data.users[m.sender]
    if (!user.eco) {
        user.eco = {
            dinero: 500,
            banco: 0,
            exp: 0,
            level: 1,
            posesiones: [],
            trabajos_realizados: 0,
            lastwork: 0
        }
    }

    const accion = args[0]?.toLowerCase()
    const cantidad = parseInt(args[1])

    // 🔑 DEPOSITAR
    if (accion === 'depositar' || accion === 'dep') {
        if (!cantidad || cantidad < 50) {
            return m.reply('❌ Mínimo 50 Nen para depositar\n\nUso: .banco depositar <cantidad>')
        }

        if (cantidad > user.eco.dinero) {
            return m.reply(`❌ No tienes suficiente dinero.\nTienes: ${user.eco.dinero} Nen`)
        }

        user.eco.dinero -= cantidad
        user.eco.banco += cantidad
        await database.save()

        return m.reply(`
✅ Depósito realizado

💵 Depositaste: ${cantidad} Nen
🏦 En banco: ${user.eco.banco} Nen
💰 En mano: ${user.eco.dinero} Nen
`)
    }

    // 🔑 RETIRAR
    if (accion === 'retirar' || accion === 'ret') {
        if (!cantidad || cantidad < 50) {
            return m.reply('❌ Mínimo 50 Nen para retirar\n\nUso: .banco retirar <cantidad>')
        }

        if (cantidad > user.eco.banco) {
            return m.reply(`❌ No tienes suficiente en el banco.\nTienes: ${user.eco.banco} Nen`)
        }

        user.eco.banco -= cantidad
        user.eco.dinero += cantidad
        await database.save()

        return m.reply(`
✅ Retiro realizado

💵 Retiraste: ${cantidad} Nen
🏦 En banco: ${user.eco.banco} Nen
💰 En mano: ${user.eco.dinero} Nen
`)
    }

    // 🔑 Si no especifica acción, mostrar estado
    m.reply(`
🏦 **BANCO**

Dinero en mano: ${user.eco.dinero} Nen
Dinero en banco: ${user.eco.banco} Nen
Total: ${user.eco.dinero + user.eco.banco} Nen

Usa:
• .banco depositar <cantidad>
• .banco retirar <cantidad>

Ejemplo: .banco depositar 100
`)
}

handler.help = ['banco']
handler.tags = ['economia']
handler.command = ['banco', 'bank']

export default handler
