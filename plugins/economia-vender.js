import { database } from '../lib/database.js'
import { negocios } from '../lib/tienda.js'

const handler = async (m, { args }) => {
    if (!database.data.users) database.data.users = {}
    const user = database.data.users[m.sender]
    if (!user || !user.eco) return m.reply('❌ Registra tu perfil primero.')
    if (!user.eco.negocios) user.eco.negocios = {}

    let itemId = args[0]?.toLowerCase()
    if (!itemId || !negocios[itemId]) return m.reply(`❌ Especifica un ID válido.\n📌 Ejemplo: .comprar tiendita`)

    const item = negocios[itemId]
    if (user.eco.dinero < item.costo) return m.reply(`❌ Fondos insuficientes en cartera. Te faltan $${item.costo - user.eco.dinero} ${global.moneda}.`)

    user.eco.dinero -= item.costo
    user.eco.negocios[itemId] = (user.eco.negocios[itemId] || 0) + 1
    await database.save()

    return m.reply(`✠ ══〔 𝑺𝒉𝒊𝖟𝒖𝒌𝒖 𝑩𝒖𝒚 〕══ ✠\n\n🖤 Adquiriste: *${item.nombre}*\n💵 Costo pagado: $${item.costo} ${global.moneda}\n📈 Rendimiento: Iniciando operaciones de blanqueo.\n\n_...negocio adquirido, no me hables si no es urgente._ 🕷️`)
}
handler.help = ['comprar']
handler.tags = ['economia']
handler.command = ['comprar']
handler.register = true
export default handler
