// ═════════════════════════════════════════════════════════════════
// RUTA: plugins/eco-semanal.js
// ═════════════════════════════════════════════════════════════════

import { database } from '../lib/database.js'

const handler = async (m, { conn }) => {
    if (!database.data.users) database.data.users = {}
    const jid = m.sender

    if (!database.data.users[jid]) {
        database.data.users[jid] = { name: m.pushName || 'Usuario', eco: { dinero: 500, banco: 0, exp: 0, level: 1, lastsemanal: 0 } }
    }

    const user = database.data.users[jid]
    if (!user.eco) user.eco = { dinero: 500, banco: 0, exp: 0, level: 1, lastsemanal: 0 }
    if (!user.eco.lastsemanal) user.eco.lastsemanal = 0 

    let tiempoEspera = 7 * 24 * 60 * 60 * 1000 
    let ahora = Date.now()
    let ultimoCobro = user.eco.lastsemanal

    if (ahora - ultimoCobro < tiempoEspera) {
        let tiempoRestante = Math.ceil((tiempoEspera - (ahora - ultimoCobro)) / 1000)
        let dias = Math.floor(tiempoRestante / 86400)
        let horas = Math.floor((tiempoRestante % 86400) / 3600)
        let minutos = Math.floor((tiempoRestante % 3600) / 60)
        return m.reply(`❌ *ACCESO DENEGADO*\n\nEl dividendo semanal no está disponible. Espera *${dias}d ${horas}h ${minutos}m* para el siguiente corte.`)
    }

    let bonoDinero = Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000 
    let bonoExp = Math.floor(Math.random() * (1200 - 500 + 1)) + 500

    user.eco.dinero += bonoDinero
    user.eco.exp += bonoExp
    user.eco.lastsemanal = ahora
    await database.save()

    let txt = `✠ ══〔 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑾𝒆𝒆𝒌𝒍𝒚 〕══ ✠\n\n`
    txt += `🕷️ *Asignación:* Inyección de Capital Semanal Completada\n`
    txt += `💵 Efectivo: +$${bonoDinero} ${global.moneda}\n`
    txt += `⭐ Prestigio: +${bonoExp} EXP\n\n`
    txt += `— _Shizuku · Araña Nº8 · no me busques si no es por dinero._ 🕷️`

    return m.reply(txt.trim())
}

handler.help = ['semanal']
handler.tags = ['economia']
handler.command = ['semanal', 'weekly']
handler.register = true

export default handler
