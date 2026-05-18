import { database } from '../lib/database.js'
import { negocios } from '../lib/tienda.js'

const handler = async (m) => {
    if (!database.data.users) database.data.users = {}
    const user = database.data.users[m.sender]
    if (!user || !user.eco) return m.reply('❌ No tienes un perfil económico activo.')
    if (!user.eco.negocios) user.eco.negocios = {}
    if (!user.eco.last_recaudar) user.eco.last_recaudar = Date.now()

    let ahora = Date.now()
    let tiempoPasado = ahora - user.eco.last_recaudar
    let horas = tiempoPasado / 3600000

    if (horas < 1) {
        let minutosRestantes = Math.ceil(60 - (tiempoPasado / 60000))
        return m.reply(`❌ Las máquinas siguen procesando el efectivo. Regresa en ${minutosRestantes} minutos.`)
    }

    let totalLavado = 0
    for (const key in negocios) {
        const cantidad = user.eco.negocios[key] || 0
        if (cantidad > 0 && negocios[key]) {
            totalLavado += Math.floor(cantidad * negocios[key].prod * horas)
        }
    }

    if (totalLavado <= 0) {
        user.eco.last_recaudar = ahora
        await database.save()
        return m.reply(`❌ Tus operaciones no han generado ganancias porque no posees negocios activos actualmente.`)
    }

    user.eco.dinero += totalLavado
    user.eco.last_recaudar = ahora
    await database.save()

    return m.reply(`✠ ══〔 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑪𝒐𝒍𝒍𝒆𝒄𝒕 〕══ ✠\n\n🖤 *Corte de Caja Exitoso*\n💵 Dinero limpio obtenido: +$${totalLavado} ${global.moneda}\n💰 Cartera total: $${user.eco.dinero} ${global.moneda}\n\n_...bóvedas vaciadas, no molestes si no es urgente._ 🕷️`)
}
handler.help = ['recaudar']
handler.tags = ['economia']
handler.command = ['recaudar']
handler.register = true
export default handler
