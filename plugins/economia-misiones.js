// ═════════════════════════════════════════════════════════════════
// SYSTEM: Operaciones 
// RUTA: plugins/eco-misiones.js
// ═════════════════════════════════════════════════════════════════

import { database } from '../lib/database.js'
import { misionesBreakingBad } from '../lib/misiones.js'

const handler = async (m, { conn }) => {
    if (!database.data.users) database.data.users = {}
    const userJid = m.sender

    if (!database.data.users[userJid]) {
        database.data.users[userJid] = { name: m.pushName || 'Usuario', eco: { dinero: 500, banco: 0, exp: 0, level: 1, lastmision: 0 } }
    }

    const user = database.data.users[userJid]
    if (!user.eco) user.eco = { dinero: 500, banco: 0, exp: 0, level: 1, lastmision: 0 }

    let tiempoEspera = 5 * 60 * 1000 
    let ahora = Date.now()
    if (ahora - user.eco.lastmision < tiempoEspera) {
        let tiempoRestante = Math.ceil((tiempoEspera - (ahora - user.eco.lastmision)) / 1000)
        let minutos = Math.floor(tiempoRestante / 60)
        let segundos = tiempoRestante % 60
        return m.reply(`❌ *OPERACIÓN DETENIDA*\n\nLa DEA vigila la zona. Espera *${minutos}m ${segundos}s* antes de iniciar un nuevo movimiento táctico.`)
    }

    const mision = misionesBreakingBad[Math.floor(Math.random() * misionesBreakingBad.length)]

    let deDinero = Math.floor(Math.random() * (4500 - 1200 + 1)) + 1200 
    let deExp = Math.floor(Math.random() * (250 - 80 + 1)) + 80        

    let txt = `✠ ══〔 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑩𝒃 𝑶𝒑𝒆𝒓𝒂𝒕𝒊𝒐𝒏 〕══ ✠\n\n`
    txt += `💀 *Misión:* ${mision.texto}\n\n`

    if (mision.tipo === 'ganar') {
        user.eco.dinero += deDinero
        user.eco.exp += deExp
        txt += `📈 *RESULTADO: OPERACIÓN EXITOSA*\n`
        txt += `💵 Recompensa: +$${deDinero} ${global.moneda}\n`
        txt += `⭐ Reputación: +${deExp} EXP\n\n`
        txt += `_...imperio expandido con éxito, mantén el perfil bajo si no es urgente._ 🕷️`
    } else {
        let dineroPerdido = user.eco.dinero < deDinero ? user.eco.dinero : deDinero
        let expPerdida = user.eco.exp < deExp ? user.eco.exp : deExp

        user.eco.dinero -= dineroPerdido
        user.eco.exp -= expPerdida
        
        txt += `📉 *RESULTADO: OPERACIÓN COMPROMETIDA*\n`
        txt += `💸 Pérdidas financieras: -$${dineroPerdido} ${global.moneda}\n`
        txt += `📉 Reputación afectada: -${expPerdida} EXP\n\n`
        txt += `_...un cabo suelto casi te destruye, no dejes cabos sueltos si no es urgente._ 🕷️`
    }

    user.eco.lastmision = ahora
    await database.save()

    return m.reply(txt.trim())
}

handler.help = ['mision']
handler.tags = ['economia']
handler.command = ['mision', 'misiones']
handler.register = true

export default handler
