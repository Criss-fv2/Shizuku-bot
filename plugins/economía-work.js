// ═════════════════════════════════════════════════════════════════
// COMANDO: .work (Diseño ultra-compacto + Estética Limpia)
// RUTA: plugins/economia-work.js
// ═════════════════════════════════════════════════════════════════

import { database } from '../lib/database.js'

const cooldownTime = 30 * 1000 // 30 segundos en milisegundos

// 🕷️ 100 Frases de trabajo: Calle, Robos, Prostitución y Estafas
const frasesTrabajo = [
    "Vendiendo tacos de perro afuera del metro.",
    "Asaltando a un estudiante en el callejón oscuro.",
    "Trabajando en la esquina de la zona roja.",
    "Cobrando el pasaje en la ruta del transporte público.",
    "Vendiendo fotos de tus pies en OnlyFans.",
    "Robando los tapones de las llantas de un Tsuru.",
    "Trabajando de cajero en el OXXO (¡y abriendo la segunda caja!).",
    "Vendiendo ropa de paca en el tianguis sobre ruedas.",
    "Bailando en el tubo de un antro de dudosa reputación.",
    "Extorsionando al dueño de la tienda de abarrotes.",
    "Lavando parabrisas en el semáforo bajo el solazo.",
    "Robando el estéreo de un carro estacionado.",
    "Ofreciendo servicios de compañía a un viejo rabo verde.",
    "Cobrando el piso en el mercado local.",
    "Haciendo malabares con fuego y limones en el semáforo.",
    "Trabajando de botarga del Dr. Simi a 40 grados.",
    "Atracando un banco con una pistola de agua pintada de negro.",
    "Vendiendo tangas usadas por internet a desconocidos.",
    "Empacando las compras de las señoras en el Calimax.",
    "Falsificando billetes de a 500 en el sótano de tu casa.",
    "Siendo la Sugar Baby de un empresario casado.",
    "Robando cobre de los postes de luz en la madrugada.",
    "Paseando a los perros de los ricos de la zona exclusiva.",
    "Repartiendo pizzas en una moto que se cae a pedazos.",
    "Ofreciendo bailes privados VIP en un table dance.",
    "Vendiendo orégano haciéndolo pasar por marihuana fina.",
    "Trabajando de guardia de seguridad durmiendo en el turno de noche.",
    "Bolseando carteras en el transporte público lleno.",
    "Vendiendo tu cuerpo por unas cuantas monedas de oro.",
    "Limpiando baños públicos en la central de autobuses.",
    "Hackeando el WiFi del vecino para vender la contraseña.",
    "Trabajando como sicario a sueldo para el cartel local.",
    "Vendiendo películas piratas y porno en el tianguis.",
    "Actuando de viuda falsa en los velorios para pedir dinero.",
    "Pidiendo limosna afuera de la iglesia fingiendo ser cojo.",
    "Robando alcantarillas de metal para venderlas al fierro viejo.",
    "Sacando a pasear a señoras ricas como su 'acompañante'.",
    "Repartiendo volantes de préstamos con intereses usureros.",
    "Entrando a casas ajenas por la ventana para robarse las televisiones.",
    "Trabajando de mesero/a en un cantina de mala muerte.",
    "Haciendo brujería y amarres falsos a corazones rotos.",
    "Vendiendo licencias de conducir falsas afuera de tránsito.",
    "Trabajando en un Call Center estafando abuelitas.",
    "Quitándole los espejos retrovisores a los carros del centro.",
    "Grabando videos para adultos en un motel barato.",
    "Trabajando de albañil echando colado desde las 6 AM.",
    "Robando la limosna de la iglesia el domingo en la misa.",
    "Vendiendo tamales y champurrado a las afueras de la fábrica.",
    "Cobrando 5 pesos por entrar a un baño público que no es tuyo.",
    "Trabajando de 'viene viene' acomodando carros en la calle.",
    "Pasando mercancía ilegal por la frontera en la mochila.",
    "Vendiendo besos a 10 pesos en la kermés del pueblo.",
    "Ayudando a cruzar gente por el desierto.",
    "Lavando baños en un club nocturno.",
    "Atracando a mano armada la farmacia de la esquina.",
    "Engañando incautos con el juego de la bolita en la calle.",
    "Ofreciendo masajes con 'final feliz' en un spa clandestino.",
    "Robando baterías de carro en la madrugada.",
    "Trabajando como chaleco antibalas humano para el jefe.",
    "Vendiendo cuentas de Netflix robadas por grupos de WhatsApp.",
    "Apostando en peleas clandestinas de gallos.",
    "Haciendo de 'mula' para transportar cosas extrañas en el estómago.",
    "Barriendo la banqueta para que la vecina te dé 20 pesos.",
    "Robando ropa interior de los tendederos para revenderla.",
    "Cuidando niños malcriados de madres solteras fiesteras.",
    "Peleando por los terrenos de la abuela con machete en mano.",
    "Secuestrando al perro del vecino para cobrar la recompensa.",
    "Vendiendo elotes enteros con chile del que sí pica.",
    "Trabajando como gigoló para señoras pensionadas.",
    "Fingiendo un atropello para sacarle dinero al seguro del conductor.",
    "Cobrando cuotas de 'protección' a los vendedores de tacos.",
    "Vendiendo garrafones de agua rellenados con agua de la llave.",
    "Robando focos de las casas ajenas por la noche.",
    "Participando en ensayos clínicos de medicinas experimentales.",
    "Mostrando tus atributos en la webcam por tokens.",
    "Vendiendo dulces de dudosa procedencia en la salida de la escuela.",
    "Haciéndola de payaso triste y contando chistes en los camiones.",
    "Asaltando un camión repartidor de Bimbo en la carretera.",
    "Vendiendo tu plasma en una clínica que huele raro.",
    "Trabajando de stripper en una despedida de soltera muy loca.",
    "Robando catalizadores de los autos estacionados en la plaza.",
    "Siendo el/la amante pagado/a del alcalde de tu ciudad.",
    "Cuidando la puerta de un antro como cadenero prepotente.",
    "Jugando arrancones ilegales por apuestas de dinero rosa.",
    "Robando los cables del internet de toda la colonia.",
    "Robando la identidad de alguien para sacar tarjetas de crédito.",
    "Vendiendo pañuelos desechables y chicles en el tráfico.",
    "Sirviendo tragos adulterados a gringos en un bar turístico.",
    "Fingiendo ser ciego en el metro cantando con una bocina rota.",
    "Cobrando por dejar pasar al baño en los conciertos.",
    "Gritando: '¡Se compran colchones, tambores, refrigeradores...!'",
    "Robando la señal del cable para vendérsela a toda la cuadra.",
    "Peleando en el lodo por dinero en una fiesta clandestina.",
    "Vendiendo tortas cubanas gigantes de carne misteriosa.",
    "Fingiendo tener una enfermedad para abrir un GoFundMe.",
    "Entregando paquetes sospechosos en moto a media noche.",
    "Recogiendo chatarra, plástico y latas en los basureros.",
    "Acostándote con el jefe para asegurar un ascenso rápido.",
    "Vendiendo uno de tus riñones en el mercado negro.",
    "Robando los juguetes de los niños en el parque para revenderlos."
]

// ═════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// ═════════════════════════════════════════════════════════════════

const handler = async (m, { conn }) => {
    if (!database.data.users) database.data.users = {}
    const jid = m.sender
    
    if (!database.data.users[jid]) {
        database.data.users[jid] = {
            name: m.pushName || 'Usuario',
            registered: false,
            eco: { dinero: 500, banco: 0, exp: 0, level: 1, posesiones: [], trabajos_realizados: 0, lastwork: 0 }
        }
    }

    const user = database.data.users[jid]
    if (!user.eco) {
        user.eco = { dinero: 500, banco: 0, exp: 0, level: 1, posesiones: [], trabajos_realizados: 0, lastwork: 0 }
    }

    // Cooldown de 30 segundos
    const ahora = Date.now()
    const tiempoTranscurrido = ahora - user.eco.lastwork

    if (tiempoTranscurrido < cooldownTime && user.eco.lastwork !== 0) {
        const tiempoFaltante = cooldownTime - tiempoTranscurrido
        const segundos = Math.floor(tiempoFaltante / 1000)
        
        return m.reply(`⏳ Aguanta la marcha, fiera. Espera *${segundos}s* antes de volver a operar. 🕷️`)
    }

    const trabajoAleatorio = frasesTrabajo[Math.floor(Math.random() * frasesTrabajo.length)]
    const dineroGanado = Math.floor(Math.random() * (500 - 150 + 1)) + 150
    const expGanada = Math.floor(dineroGanado / 10)

    user.eco.dinero += dineroGanado
    user.eco.exp += expGanada
    user.eco.trabajos_realizados += 1
    user.eco.lastwork = ahora
    user.eco.level = Math.floor(user.eco.exp / 1000) + 1

    await database.save()

    
    const mensajeCorto = `
✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝖤𝖼𝗈𝗇𝗈𝖒𝗒 〕══ ✠

🕸️ Operación: ${trabajoAleatorio}

💵 Ganancia: +$${dineroGanado} ${global.moneda}
✨ Exp: +${expGanada} XP

Cartera: $${user.eco.dinero} ${global.moneda} 
| Nivel: ${user.eco.level} (${user.eco.exp} EXP)
_...fondos guardados, espera 30s._ 🕷️
    `.trim()
    
    await conn.sendMessage(m.chat, { text: mensajeCorto }, { quoted: m })
}

handler.help = ['work']
handler.tags = ['economia']
handler.command = ['work', 'trabajar', 'chambear', 'operar']
handler.register = true

export default handler
