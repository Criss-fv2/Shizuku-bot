// ═════════════════════════════════════════════════════════════════
// RUTA: plugins/economia-perfil.js
// ═════════════════════════════════════════════════════════════════

import { database } from '../lib/database.js'
import { negocios } from '../lib/tienda.js'

const handler = async (m, { conn }) => {
    if (!database.data.users) database.data.users = {}
    const jid = m.sender
    
    if (!database.data.users[jid]) {
        database.data.users[jid] = {
            name: m.pushName || 'Usuario',
            registered: false,
            premium: false,
            banned: false,
            warning: 0,
            exp: 0,
            level: 1,
            limit: 20,
            lastclaim: 0,
            registered_time: 0,
            age: null,
            eco: { 
                dinero: 500, 
                banco: 0, 
                exp: 0, 
                level: 1, 
                posesiones: [], 
                negocios: {},
                last_recaudar: Date.now(),
                trabajos_realizados: 0, 
                lastwork: 0,
                totalEarned: 0,
                totalLost: 0,
                wins: 0,
                losses: 0
            }
        }
        await database.save()
    }

    const user = database.data.users[jid]
    
    if (!user.eco) {
        user.eco = { 
            dinero: 500, 
            banco: 0, 
            exp: 0, 
            level: 1, 
            posesiones: [], 
            negocios: {},
            last_recaudar: Date.now(),
            trabajos_realizados: 0, 
            lastwork: 0,
            totalEarned: 0,
            totalLost: 0,
            wins: 0,
            losses: 0
        }
        await database.save()
    }

    if (!user.eco.negocios) user.eco.negocios = {}
    if (!user.eco.posesiones) user.eco.posesiones = []

    let profilePic = 'https://files.catbox.moe/9enbxk.jpg'
    try {
        profilePic = await conn.profilePictureUrl(jid, 'image')
    } catch (e) {
        
    }

    const numero = jid.split('@')[0]
    const totalDinero = user.eco.dinero + user.eco.banco
    const expParaNivel = 1000
    const expActual = user.eco.exp % expParaNivel
    const expFaltante = expParaNivel - expActual
    const porcentajeExp = Math.floor((expActual / expParaNivel) * 100)
    
    const barra = '█'.repeat(Math.floor(porcentajeExp / 10)) + '░'.repeat(10 - Math.floor(porcentajeExp / 10))
    
    const fechaRegistro = user.registered_time 
        ? new Date(user.registered_time).toLocaleDateString('es-CO')
        : 'No registrada'

    // Variables de estado recuperadas y adaptadas a la estética del bot
    const estadoRegistro = user.registered ? 'Verificado' : 'Sin verificar'
    const estadoPremium = user.premium ? '💎 Premium Activo' : '⚪ Usuario Estándar'
    const estadoBan = user.banned ? '🚫 Baneado de la Red' : '✅ Activo'

    // ─── CONSTRUCCIÓN DEL INVENTARIO DE NEGOCIOS ───
    let inventarioTexto = ''
    let tieneNegocios = false

    for (const key in negocios) {
        const cantidad = user.eco.negocios[key] || 0
        if (cantidad > 0) {
            tieneNegocios = true
            inventarioTexto += `\n ├ 🕸️ ${negocios[key].nombre}: *${cantidad}*`
        }
    }

    if (tieneNegocios) {
        inventarioTexto = `\n📦 *Propiedades Activas:*${inventarioTexto}`
    } else {
        inventarioTexto = '\n📦 Items: _Vacío (Sin operaciones de blanqueo)_'
    }

    const perfilText = `
✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝒌𝖚 𝕻𝖗𝖔𝖋𝖎𝖑𝖊 〕══ ✠

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑴𝒆𝒎𝒃𝒆𝒓 𝑰𝒏𝒇𝒐
👤 Nombre: ${user.name || 'Sin nombre'}
📱 ID: @${numero}
📅 Registro: ${fechaRegistro} | 🎂 Edad: ${user.age || 'N/A'}

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑴𝒆𝒎𝒃𝒆𝒓 𝑺𝒕𝒂𝒕𝒖𝒔
🛡️ Estado: ${estadoBan}
💳 Pase: ${estadoPremium}
🗂️ Tipo: ${estadoRegistro}
⚠️ Advertencias: ${user.warning || 0}/3

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑬𝒄𝒐𝒏𝒐𝒎𝒚
💵 Efectivo: $${user.eco.dinero} ${global.moneda}
🏦 Banco: $${user.eco.banco} ${global.moneda}
💰 Total Neto: $${totalDinero} ${global.moneda}
⚡ Límite Diario: ${user.limit || 0} diamantes

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑳𝒆𝒗𝒆𝒍 & 𝑬𝒙𝒑
📈 Rango: Nivel ${user.eco.level}
⭐ Progreso: ${user.eco.exp} EXP total [${barra}]
🎯 Siguiente Nivel: Faltan ${expFaltante} EXP (${porcentajeExp}%)

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑾𝒐𝒓𝒌 𝑺𝒕𝒂𝒕𝒔
💼 Labores: ${user.eco.trabajos_realizados} hechas
📊 Récord (G/P): ${user.eco.wins || 0} victorias / ${user.eco.losses || 0} derrotas

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑰𝑱𝑽𝑬𝑶𝑹𝒀${inventarioTexto}

_...datos sincronizados, la red está vigilante._ 🕷️
    `.trim()

    await conn.sendMessage(m.chat, {
        image: { url: profilePic },
        caption: perfilText,
        mentions: [jid]
    }, { quoted: m })
}

handler.help = ['perfil']
handler.tags = ['economia']
handler.command = ['perfil', 'profile']
handler.register = true

export default handler
