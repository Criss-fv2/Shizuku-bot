// ═════════════════════════════════════════════════════════════════
// SYSTEM: Operaciones de Asalto y Crimen Organizado
// RUTA: plugins/eco-robar.js
// ═════════════════════════════════════════════════════════════════

import { database } from '../lib/database.js'

const handler = async (m, { conn, command }) => {
    if (!database.data.users) database.data.users = {}
    const asaltanteJid = m.sender

    
    if (!database.data.users[asaltanteJid]) {
        database.data.users[asaltanteJid] = { name: m.pushName || 'Usuario', eco: { dinero: 500, banco: 0, exp: 0, level: 1, lastrobar: 0 } }
    }
    const asaltante = database.data.users[asaltanteJid]
    if (!asaltante.eco) asaltante.eco = { dinero: 500, banco: 0, exp: 0, level: 1, lastrobar: 0 }
    if (!asaltante.eco.lastrobar) asaltante.eco.lastrobar = 0

    
    let tiempoEspera = 10 * 60 * 1000 
    let ahora = Date.now()
    if (ahora - asaltante.eco.lastrobar < tiempoEspera) {
        let tiempoRestante = Math.ceil((tiempoEspera - (ahora - asaltante.eco.lastrobar)) / 1000)
        let minutos = Math.floor(tiempoRestante / 60)
        let segundos = tiempoRestante % 60
        return m.reply(`❌ *SISTEMA VIGILANTE*\n\nEstás bajo sospecha policial. Espera *${minutos}m ${segundos}s* antes de planear tu siguiente golpe.`)
    }

    
    let victimaJid = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null

    if (!victimaJid) {
        return m.reply(`❌ *ERROR DE OBJETIVO*\n\nDebes etiquetar a un usuario o responder a su mensaje para ejecutar el asalto.\n📌 Ejemplo: .robar @tag`)
    }

    if (victimaJid === asaltanteJid) {
        return m.reply(`❌ ¿Intentas robarte a ti mismo? No juegues con la red de esa manera.`)
    }

    
    const victima = database.data.users[victimaJid]
    if (!victima || !victima.eco || victima.eco.dinero <= 0) {
        return m.reply(`❌ *OPERACIÓN ABORTADA*\n\nEl objetivo no carga efectivo en su cartera. No vale la pena el riesgo.`)
    }

    // ─── CÁLCULO DE PROBABILIDADES (45% ÉXITO / 55% FRACASO) ───
    let azar = Math.random() * 100
    let txt = `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕮𝖗𝖎𝖒𝖊 〕══ ✠\n\n`

    if (azar <= 45) {
        
        let porcentajeRobado = Math.floor(Math.random() * (35 - 15 + 1)) + 15
        let botin = Math.floor((victima.eco.dinero * porcentajeRobado) / 100)

        if (botin <= 0) botin = 1 

        
        victima.eco.dinero -= botin
        asaltante.eco.dinero += botin
        asaltante.eco.exp += 50 

        txt += `🕷️ *Tipo:* Asalto Callejero\n`
        txt += `👤 *Objetivo:* @${victimaJid.split('@')[0]}\n\n`
        txt += `📈 *RESULTADO: OPERACIÓN EXITOSA*\n`
        txt += `💵 Botín extraído: +$${botin} ${global.moneda}\n`
        txt += `⭐ Reputación criminal: +50 EXP\n\n`
        txt += `_...limpieza impecable. Guarda el efectivo antes de que te lo quiten a ti._ 🕸️`
    } else {
        
        let multaBase = Math.floor(Math.random() * (3500 - 1000 + 1)) + 1000
        let multaReal = asaltante.eco.dinero < multaBase ? asaltante.eco.dinero : multaBase

        
        asaltante.eco.dinero -= multaReal
        victima.eco.dinero += multaReal

        txt += `🕷️ *Tipo:* Asalto Callejero\n`
        txt += `👤 *Objetivo:* @${victimaJid.split('@')[0]}\n\n`
        txt += `📉 *RESULTADO: OPERACIÓN COMPROMETIDA*\n`
        txt += `🚨 La policía frustró tu golpe. Fuiste obligado a indemnizar a la víctima.\n`
        txt += `💸 Multa pagada: -$${multaReal} ${global.moneda}\n\n`
        txt += `_...cuidado con quién te metes, la próxima vez podrías acabar encerrado._ 🕸️`
    }

    
    asaltante.eco.lastrobar = ahora
    await database.save()

    return conn.sendMessage(m.chat, { text: txt.trim(), mentions: [asaltanteJid, victimaJid] }, { quoted: m })
}

handler.help = ['robar']
handler.tags = ['economia']
handler.command = ['robar', 'crimen', 'asaltar']
handler.group = true 
handler.register = true

export default handler
