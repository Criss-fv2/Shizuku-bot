import { database } from '../lib/database.js'
import { negocios } from '../lib/tienda.js'

const handler = async (m) => {
    if (!database.data.users) database.data.users = {}
    const user = database.data.users[m.sender] || { eco: { dinero: 500, negocios: {} } }
    if (!user.eco) user.eco = { dinero: 500, negocios: {} }
    if (!user.eco.negocios) user.eco.negocios = {}

    let txt = `✠ ══〔 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑻𝒊𝒆𝒏𝒅𝒂 〕══ ✠\n\n🖤 *Mercado de Lavado de Dinero*\n`
    for (const key in negocios) {
        const n = negocios[key]
        const propiedad = user.eco.negocios[key] || 0
        txt += `\n🕸️ *${n.nombre}* [ID: ${n.ID}]\n💵 Costo: $${n.costo} ${global.moneda}\n📈 Lava: +$${n.prod} ${global.moneda} x hora\n📌 Tienes: ${propiedad} comprados\n`
    }
    txt += `\n_Para adquirir usa: .comprar [ID]_\n_...bienes raíces listados, no mires si no es urgente._ 🕷️`
    return m.reply(txt.trim())
}
handler.help = ['tienda']
handler.tags = ['economia']
handler.command = ['tienda']
handler.register = true
export default handler
