// ═════════════════════════════════════════════════════════════════
// SYSTEM: Lavado de Dinero (Motor Unificado Conectado a lib/tienda.js)
// RUTA: plugins/economia-lavado.js
// ═════════════════════════════════════════════════════════════════

import { database } from '../lib/database.js'
import { negocios } from '../lib/tienda.js'

const handler = async (m, { conn, args, command }) => {
    if (!database.data.users) database.data.users = {}
    const userJid = m.sender

    if (!database.data.users[userJid]) {
        database.data.users[userJid] = { name: m.pushName || 'Usuario', eco: { dinero: 500, banco: 0, exp: 0, level: 1, posesiones: [], trabajos_realizados: 0, lastwork: 0 } }
    }

    const user = database.data.users[userJid]
    if (!user.eco) user.eco = { dinero: 500, banco: 0, exp: 0, level: 1, posesiones: [], trabajos_realizados: 0, lastwork: 0 }
    if (!user.eco.negocios) user.eco.negocios = {}
    if (!user.eco.last_recaudar) user.eco.last_recaudar = Date.now()

    // ─── COMANDO: .TIENDA ───
    if (command === 'tienda') {
        let txt = `✠ ══〔 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑻𝒊𝒆𝒏𝒅𝒂 〕══ ✠\n\n🖤 *Mercado de Lavado de Dinero*\n`
        for (const key in negocios) {
            const n = negocios[key]
            const propiedad = user.eco.negocios[key] || 0
            txt += `\n🕸️ *${n.nombre}* [ID: ${n.ID}]\n`
            txt += `💵 Costo: $${n.costo} ${global.moneda}\n`
            txt += `📈 Lava: +$${n.prod} ${global.moneda} x hora\n`
            txt += `📌 Tienes: ${propiedad} comprados\n`
        }
        txt += `\n_Para adquirir usa: .comprar [ID]_\n_...bienes raíces listados, no mires si no es urgente._ 🕷️`
        return m.reply(txt.trim())
    }

    // ─── COMANDO: .COMPRAR ───
    if (command === 'comprar') {
        let itemId = args[0]?.toLowerCase()
        if (!itemId || !negocios[itemId]) {
            return m.reply(`❌ Especifica un ID válido.\n📌 Ejemplo: .comprar tiendita`)
        }

        const item = negocios[itemId]
        if (user.eco.dinero < item.costo) {
            return m.reply(`❌ Fondos insuficientes en cartera. Te faltan $${item.costo - user.eco.dinero} ${global.moneda}.`)
        }

        user.eco.dinero -= item.costo
        user.eco.negocios[itemId] = (user.eco.negocios[itemId] || 0) + 1
        await database.save()

        return m.reply(`✠ ══〔 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑩𝒖𝒚 〕══ ✠\n\n🖤 Adquiriste: *${item.nombre}*\n💵 Costo pagado: $${item.costo} ${global.moneda}\n📈 Rendimiento: Iniciando operaciones de blanqueo.\n\n_...negocio adquirido, no me hables si no es urgente._ 🕷️`)
    }

    // ─── COMANDO: .VENDER ───
    if (command === 'vender') {
        let itemId = args[0]?.toLowerCase()
        if (!itemId || !negocios[itemId]) {
            return m.reply(`❌ Especifica el ID del negocio a liquidar.\n📌 Ejemplo: .vender tiendita`)
        }

        if (!user.eco.negocios[itemId] || user.eco.negocios[itemId] <= 0) {
            return m.reply(`❌ No eres dueño de ningún negocio con el ID: ${itemId}.`)
        }

        const item = negocios[itemId]
        let precioVenta = Math.floor(item.costo * 0.70)

        user.eco.negocios[itemId] -= 1
        user.eco.dinero += precioVenta
        await database.save()

        return m.reply(`✠ ══〔 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑺𝒆𝒍𝒍 〕══ ✠\n\n🖤 Liquidaste: *${item.nombre}*\n💵 Remate (70%): +$${precioVenta} ${global.moneda}\n📌 Te quedan: ${user.eco.negocios[itemId]} unidades.\n\n_...propiedad vendida, no me busques si no es urgente._ 🕷️`)
    }

    // ─── COMANDO: .RECAUDAR ───
    if (command === 'recaudar') {
        let ahora = Date.now()
        let tiempoPasado = ahora - user.eco.last_recaudar
        let horas = tiempoPasado / 3600000

        if (horas < 1) {
            let minutosRestantes = Math.ceil(60 - (tiempoPasado / 60000))
            return m.reply(`❌ Las máquinas siguen procesando el efectivo. Regresa en ${minutosRestantes} minutes.`)
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
}

handler.help = ['tienda', 'comprar', 'vender', 'recaudar']
handler.tags = ['economia']
handler.command = /^(tienda|comprar|vender|recaudar)$/i
handler.register = true

export default handler
