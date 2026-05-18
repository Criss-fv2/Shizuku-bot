// ═════════════════════════════════════════════════════════════════
// SYSTEM: Sistema de Prostitución Clandestina y Trabajo de Calle
// RUTA: plugins/eco-prostituta.js
// ═════════════════════════════════════════════════════════════════

import { database } from '../lib/database.js'
import { frasesProstituta } from '../lib/prostitucion.js'

const handler = async (m, { conn }) => {
    if (!database.data.users) database.data.users = {}
    const jid = m.sender

    if (!database.data.users[jid]) {
        database.data.users[jid] = { name: m.pushName || 'Usuario', eco: { dinero: 500, banco: 0, exp: 0, level: 1, lastslut: 0 } }
    }

    const user = database.data.users[jid]
    if (!user.eco) user.eco = { dinero: 500, banco: 0, exp: 0, level: 1, lastslut: 0 }
    if (!user.eco.lastslut) user.eco.lastslut = 0

    let tiempoEspera = 10 * 60 * 1000 
    let ahora = Date.now()
    if (ahora - user.eco.lastslut < tiempoEspera) {
        let tiempoRestante = Math.ceil((tiempoEspera - (ahora - user.eco.lastslut)) / 1000)
        let minutos = Math.floor(tiempoRestante / 60)
        let segundos = tiempoRestante % 60
        return m.reply(`❌ *ZONA VIGILADA*\n\nEstás demasiado exhausta o la plaza está caliente. Espera *${minutos}m ${segundos}s* para volver a la calle.`)
    }

    const situacion = frasesProstituta[Math.floor(Math.random() * frasesProstituta.length)]

    let deDinero = Math.floor(Math.random() * (3500 - 800 + 1)) + 800 
    let deExp = Math.floor(Math.random() * (150 - 50 + 1)) + 50        

    let txt = `✠ ══〔 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑺𝒍𝒖𝒕 〕══ ✠\n\n`
    txt += `🖤 *Calle:* ${situacion.texto}\n\n`

    if (situacion.tipo === 'ganar') {
        user.eco.dinero += deDinero
        user.eco.exp += deExp
        txt += `📈 *RESULTADO: PLAZA COBRADA*\n`
        txt += `💵 Ganancia: +$${deDinero} ${global.moneda}\n`
        txt += `⭐ Reputación: +${deExp} EXP\n\n`
    } else {
        let dineroPerdido = user.eco.dinero < deDinero ? user.eco.dinero : deDinero
        let expPerdida = user.eco.exp < deExp ? user.eco.exp : deExp

        user.eco.dinero -= dineroPerdido
        user.eco.exp -= expPerdida
        
        txt += `📉 *RESULTADO: ACTO FALLIDO*\n`
        txt += `💸 Pérdidas: -$${dineroPerdido} ${global.moneda}\n`
        txt += `📉 Reputación: -${expPerdida} EXP\n\n`
    }

    txt += `— _Shizuku · Araña Nº8 · no me molestes si no es urgente_ 🕷️`

    user.eco.lastslut = ahora
    await database.save()

    return m.reply(txt.trim())
}

handler.help = ['prostituta']
handler.tags = ['economia']
handler.command = ['prostituta', 'slut', 'puta']
handler.register = true

export default handler
