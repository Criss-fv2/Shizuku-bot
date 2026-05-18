// ════════════════════════════════════════════════════════════════
// RUTA: plugins/eco-diario.js
// ═════════════════════════════════════════════════════════════════

import { database } from '../lib/database.js'

const handler = async (m, { conn }) => {
    if (!database.data.users) database.data.users = {}
    const jid = m.sender

    if (!database.data.users[jid]) {
        database.data.users[jid] = { name: m.pushName || 'Usuario', eco: { dinero: 500, banco: 0, exp: 0, level: 1, lastclaim: 0 } }
    }

    const user = database.data.users[jid]
    if (!user.eco) user.eco = { dinero: 500, banco: 0, exp: 0, level: 1, lastclaim: 0 }
    if (!user.lastclaim) user.lastclaim = 0 

    let tiempoEspera = 24 * 60 * 60 * 1000 
    let ahora = Date.now()
    let ultimoCobro = user.lastclaim || 0

    if (ahora - ultimoCobro < tiempoEspera) {
        let tiempoRestante = Math.ceil((tiempoEspera - (ahora - ultimoCobro)) / 1000)
        let horas = Math.floor(tiempoRestante / 3600)
        let minutos = Math.floor((tiempoRestante % 3600) / 60)
        let segundos = tiempoRestante % 60
        return m.reply(`❌ *ACCESO DENEGADO*\n\nTus fondos diarios ya fueron retirados. Vuelve en *${horas}h ${minutos}m ${segundos}s*.`)
    }

    let bonoDinero = Math.floor(Math.random() * (5000 - 1500 + 1)) + 1500 
    let bonoExp = Math.floor(Math.random() * (300 - 100 + 1)) + 100

    user.eco.dinero += bonoDinero
    user.eco.exp += bonoExp
    user.lastclaim = ahora
    await database.save()

    let txt = `✠ ══〔 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑫𝒂𝒊𝒍𝒚 〕══ ✠\n\n`
    txt += `🕷️ *Asignación:* Fondos de la Red de Seguridad Sincronizados\n`
    txt += `💵 Efectivo: +$${bonoDinero} ${global.moneda}\n`
    txt += `⭐ Prestigio: +${bonoExp} EXP\n\n`
    txt += `— _Shizuku · Araña Nº8 · no me busques si no es por dinero._ 🕷️`

    return m.reply(txt.trim())
}

handler.help = ['diario']
handler.tags = ['economia']
handler.command = ['diario', 'daily', 'reclamar']
handler.register = true

export default handler
