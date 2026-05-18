// ═════════════════════════════════════════════════════════════════
// COMANDO: .perfil (Ver información completa del usuario)
// RUTA: plugins/economia-perfil.js
// ═════════════════════════════════════════════════════════════════

// 🔗 RUTA: Importar la base de datos
import { database } from '../lib/database.js'

// ═════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// ═════════════════════════════════════════════════════════════════

const handler = async (m, { conn }) => {
    // 📍 Obtener ID del usuario
    const jid = m.sender  // ej: "5216653470605@s.whatsapp.net"
    
    // ─── PASO 1: Verificar que existe la tabla de usuarios ────────
    if (!database.data.users) {
        database.data.users = {}
    }

    // ─── PASO 2: Verificar que el usuario existe ────────────────
    if (!database.data.users[jid]) {
        return m.reply('⚠️ No tienes perfil aún.\n\nUsa .work para crear tu economía.')
    }

    // ─── PASO 3: Obtener la información del usuario ──────────────
    const user = database.data.users[jid]
    
    // Si no tiene economía, crear
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
        await database.save()
    }

    // ─── PASO 4: Obtener la economía ────────────────────────────
    const eco = user.eco

    // ─── PASO 5: Calcular información derivada ──────────────────
    const totalDinero = eco.dinero + eco.banco       // Total dinero (en mano + banco)
    const expParaProxNivel = 1000                    // Experiencia necesaria por nivel
    const expActual = eco.exp % expParaProxNivel    // Experiencia para el siguiente nivel
    const expNecesaria = expParaProxNivel - expActual
    const porcentajeExp = Math.floor((expActual / expParaProxNivel) * 100)
    
    // ─── PASO 6: Crear número de teléfono legible ──────────────
    // m.sender = "5216653470605@s.whatsapp.net"
    // Extraer solo el número
    const numero = jid.split('@')[0]  // "5216653470605"

    // ─── PASO 7: Crear el mensaje del perfil ────────────────────
    const mensaje = `
╭─────────────────────────────────────╮
│         👤 TU PERFIL COMPLETO       │
╰─────────────────────────────────────╯

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 INFORMACIÓN GENERAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Nombre: ${user.name || 'Sin nombre'}
📱 Número: +${numero}
📅 Registrado: ${user.registered ? 'Sí ✅' : 'No ❌'}
💎 Premium: ${user.premium ? 'Sí ✅' : 'No ❌'}
🚫 Baneado: ${user.banned ? 'Sí ❌' : 'No ✅'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 INFORMACIÓN ECONÓMICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💵 Dinero en mano: ${eco.dinero} Nen
🏦 Dinero en banco: ${eco.banco} Nen
💰 Total: ${totalDinero} Nen

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 NIVEL Y EXPERIENCIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Nivel: ${eco.level}
⭐ Experiencia: ${eco.exp}
📍 Progreso: ${expActual}/${expParaProxNivel} (${porcentajeExp}%)
🎯 Para próximo nivel: ${expNecesaria} exp

${'█'.repeat(Math.floor(porcentajeExp / 5))}${'░'.repeat(20 - Math.floor(porcentajeExp / 5))}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 ESTADÍSTICAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Trabajos realizados: ${eco.trabajos_realizados}
📈 Total ganado: ${eco.totalEarned || 0} Nen
📉 Total perdido: ${eco.totalLost || 0} Nen
🏆 Victorias en apuestas: ${eco.wins || 0}
💀 Derrotas en apuestas: ${eco.losses || 0}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎁 POSESIONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${eco.posesiones && eco.posesiones.length > 0 
  ? eco.posesiones.map((item, index) => `${index + 1}. ${item}`).join('\n')
  : '📦 Sin items aún'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

> ShizukuSystem 🕷️
    `

    // ─── PASO 8: Responder al usuario ────────────────────────────
    m.reply(mensaje)
}

// ═════════════════════════════════════════════════════════════════
// METADATOS DEL COMANDO
// ═════════════════════════════════════════════════════════════════

handler.help = ['perfil']
handler.tags = ['economia']
handler.command = ['perfil', 'profile', 'estadisticas', 'stats']

export default handler
