// ═════════════════════════════════════════════════════════════════
// RUTA: plugins/eco-mensual.js
// ═════════════════════════════════════════════════════════════════

import { database } from '../lib/database.js'

const handler = async (m, { conn }) => {
    if (!database.data.users) database.data.users = {}
    const jid = m.sender

    if (!database.data.users[jid]) {
        database.data.users[jid] = { name: m.pushName || 'Usuario', eco: { dinero: 500, banco: 0, exp: 0, level: 1, lastmensual: 0 } }
    }

    const user = database.data.users[jid]
    if (!user.eco) user.eco = { dinero: 500, banco: 0, exp: 0, level: 1, lastmensual: 0 }
    if (!user.eco.lastmensual) user.eco.lastmensual = 0 

    let tiempoEspera = 30 * 24 * 60 * 60 * 1000 
    let ahora = Date.now()
    let ultimoCobro = user.eco.lastmensual

    if (ahora - ultimoCobro < tiempoEspera) {
        let tiempoRestante = Math.ceil((tiempoEspera - (ahora - ultimoCobro)) / 1000)
        let dias = Math.floor(tiempoRestante / 86400)
        let horas = Math.floor((tiempoRestante % 86400) / 3600)
        let minutos = Math.floor((tiempoRestante % 3600) / 60)
        return m.reply(`❌ *ACCESO DENEGADO*\n\nEl dividendo mensual no está disponible. Espera *${dias}d ${horas}h ${minutos}m* para liberar los fondos.`)
    }

    let bonoDinero = Math.floor(Math.random() * (120000 - 50000 + 1)) + 50000 
    let bonoExp = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000

    user.eco.dinero += bonoDinero
    user.eco.exp += bonoExp
    user.eco.lastmensual = ahora
    await database.save()

    let txt = `✠ ══〔 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑴𝒐𝒏𝒕𝒉𝒍𝒚 〕══ ✠\n\n`
    txt += `🕷️ *Asignación:* Corte Mensual de Activos Completado\n`
    txt += `💵 Efectivo: +$${bonoDinero} ${global.moneda}\n`
    txt += `⭐ Prestigio: +${bonoExp} EXP\n\n`
    txt += `— _Shizuku · Araña Nº8 · no me busques si no es por dinero._ 🕷️`

    return m.reply(txt.trim())
}

handler.help = ['mensual']
handler.tags = ['economia']
handler.command = ['mensual', 'monthly']
handler.register = true

export default handler
