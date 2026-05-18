// ═════════════════════════════════════════════════════════════════
// RUTA: plugins/economia-perfil.js
// ═════════════════════════════════════════════════════════════════

import { database } from '../lib/database.js'

const handler = async (m, { conn }) => {
    if (!database.data.users) database.data.users = {}
    const jid = m.sender
    
    // Inicializar datos del usuario si no existen
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
    
    // Asegurar que existe eco
    if (!user.eco) {
        user.eco = { 
            dinero: 500, 
            banco: 0, 
            exp: 0, 
            level: 1, 
            posesiones: [], 
            trabajos_realizados: 0, 
            lastwork: 0,
            totalEarned: 0,
            totalLost: 0,
            wins: 0,
            losses: 0
        }
        await database.save()
    }

    // 🕸️ Obtener foto de perfil del usuario
    let profilePic = 'https://files.catbox.moe/9enbxk.jpg'
    try {
        profilePic = await conn.profilePictureUrl(jid, 'image')
    } catch (e) {
        // Sin foto, usa la por defecto
    }

    // 🕷️ Calcular información útil
    const numero = jid.split('@')[0]
    const totalDinero = user.eco.dinero + user.eco.banco
    const expParaNivel = 1000
    const expActual = user.eco.exp % expParaNivel
    const expFaltante = expParaNivel - expActual
    const porcentajeExp = Math.floor((expActual / expParaNivel) * 100)
    
    // Barra de progreso visual compacta (10 bloques)
    const barra = '█'.repeat(Math.floor(porcentajeExp / 10)) + '░'.repeat(10 - Math.floor(porcentajeExp / 10))
    
    // Calcular fecha de registro (si existe)
    const fechaRegistro = user.registered_time 
        ? new Date(user.registered_time).toLocaleDateString('es-CO')
        : 'No registrada'

    // Estado visual limpio
    const estadoRegistro = user.registered ? '✅' : '❌'
    const estadoPremium = user.premium ? '💎' : '⚪'
    const estadoBan = user.banned ? '🚫' : '✅'

    // 🕷️ Mensaje compacto con encabezados en fuente: 𝑺𝒉𝒊𝖟𝒖𝒌𝒖
    const perfilText = `
✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕻𝖗𝖔𝖋𝖎𝖑𝖊 〕══ ✠

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑷𝒆𝒓𝒔𝒐𝒏𝒂𝒍 𝑰𝒏𝒇𝒐
👤 Nombre: ${user.name || 'Sin nombre'}
📱 ID: @${numero}
📅 Registro: ${fechaRegistro} | 🎂 Edad: ${user.age || 'N/A'}

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑨𝒄𝒄𝒐𝒖𝒏𝒕 𝑺𝒕𝒂𝒕𝒖𝒔
📌 Registro: ${estadoRegistro} | Premium: ${estadoPremium} | Estado: ${estadoBan}
⚠️ Advertencias: ${user.warning} | 🔋 Límite Diario: ${user.limit}

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑬𝒄𝒐𝒏𝒐𝒎𝒚
💵 Efectivo: $${user.eco.dinero} Nen
🏦 Banco: $${user.eco.banco} Nen
💰 Total Neto: $${totalDinero} Nen

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑳𝒆𝒗𝒆𝒍 & 𝑬𝒙𝒑
📈 Rango: Nivel ${user.eco.level}
⭐ Progreso: ${user.eco.exp} EXP total [${barra}]
🎯 Siguiente Nivel: Faltan ${expFaltante} EXP (${porcentajeExp}%)

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑾𝒐𝒓𝒌 𝑺𝒕𝒂𝒕𝒔
💼 Labores: ${user.eco.trabajos_realizados} hechas
📈 Ganado: +$${user.eco.totalEarned} | 📉 Perdido: -$${user.eco.totalLost}
🏆 Winrate: ${user.eco.wins} W / ${user.eco.losses} L

🕸️ 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑰𝒏𝒗𝒆𝒏𝒕𝒐𝒓𝒚
📦 Items: ${user.eco.posesiones.length > 0 ? user.eco.posesiones.join(', ') : 'Vacío'}

_...datos sincronizados, la red está vigilante._ 🕷️
    `.trim()

    // Enviar la imagen junto con el texto y la mención
    await conn.sendMessage(m.chat, {
        image: { url: profilePic },
        caption: perfilText,
        mentions: [jid]
    }, { quoted: m })
}

handler.help = ['perfil']
handler.tags = ['economia']
handler.command = ['perfil', 'profile', 'me', 'yo', 'stats']
handler.register = true

export default handler
