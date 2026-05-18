// ═════════════════════════════════════════════════════════════════
// RUTA: lib/prostitucion.js
// ═════════════════════════════════════════════════════════════════

export const frasesProstituta = [
    { texto: "Le chupaste el miembro a un cliente pesado detrás de un palenque clandestino y le gustó el servicio.", tipo: "ganar" },
    { texto: "Te acostaste con un escolta de la organización en un motel de paso y te pagó con billetes limpios.", tipo: "ganar" },
    { texto: "Te pusiste a trabajar la esquina en una zona controlada y un cliente adinerado te dejó una buena propina.", tipo: "ganar" },
    { texto: "Un comandante te contrató para una noche privada y te pagó el doble por discreción absoluta.", tipo: "ganar" },
    { texto: "Te la rifaste dándole un servicio VIP a un extranjero en una suite ejecutiva y saliste con los bolsillos llenos.", tipo: "ganar" },
    { texto: "Un cliente premium te buscó por tu reputación en las calles y te pagó una tarifa alta sin protestar.", tipo: "ganar" },
    { texto: "Te subiste a la camioneta de un empresario que buscaba pasar el rato y te soltó una buena paca de dinero.", tipo: "ganar" },
    { texto: "Hiciste un servicio rápido en el baño de un antro controlado y cobraste en efectivo de inmediato.", tipo: "ganar" },
    { texto: "Un distribuidor local te pagó una fuerte suma por acompañarlo toda la noche a sus eventos privados.", tipo: "ganar" },
    { texto: "Te contrataron en una casa de seguridad para complacer a los mandos y te fue bastante bien con las propinas.", tipo: "ganar" },
    { texto: "Un cliente te rechazó a mitad del acto diciendo que ya estabas muy abierta y no te quiso pagar nada.", tipo: "perder" },
    { texto: "A un tipo no le gustó cómo se la chupaste, se puso violento y te robó lo que llevabas de la cartera.", tipo: "perder" },
    { texto: "La policía te agarró trabajando la esquina sin permiso y tuviste que pagar una fianza para que no te encerraran.", tipo: "perder" },
    { texto: "Un cliente te pagó con billetes falsos de la organización y perdiste toda la inversión de tu tiempo.", tipo: "perder" },
    { texto: "Te topaste con un proxeneta local que te exigió cobro de piso a la fuerza, quitándote tus ganancias del día.", tipo: "perder" },
    { texto: "Un cliente se quejó de tu higiene, te dejó tirada en la carretera y tuviste que pagar el taxi de regreso.", tipo: "perder" },
    { texto: "Intentaste cobrar por adelantado pero el tipo te amedrentó con su gente y te obligó a trabajar gratis.", tipo: "perder" },
    { texto: "Un sujeto te canceló a última hora alegando que cobrabas demasiado para la mala calidad de tu servicio.", tipo: "perder" },
    { texto: "Te pusiste demasiado exigente con la tarifa y el cliente prefirió irse con otra de la competencia.", tipo: "perder" },
    { texto: "Tuviste que gastar una fuerte suma de dinero en clínicas clandestinas tras un servicio que salió mal.", tipo: "perder" }
];

const clientes = ["un lugarteniente de la plaza", "un trailero en la carretera federal", "un gatillero borracho", "un lavador de dinero", "un prestamista gota a gota"];
const zonas = ["detrás de un casino ilegal", "en un motel de la periferia", "en la parte trasera de una camioneta blindada", "en una zona de tolerancia controlada", "en el estacionamiento de un antro"];
const motivosExito = ["quedó fascinado con tu trato", "te dejó un bono por no hacer preguntas", "te pagó una tarifa preferencial por tus servicios", "te recomendó con sus socios de la organización"];
const motivosFracaso = ["dijo que cobrabas mucho por estar tan usada", "te aventó el dinero en la cara alegando un pésimo servicio", "te quitó tus pertenencias tras una discusión violenta", "se fue sin pagar aprovechando un descuido"];

for (let i = 0; i < 20; i++) {
    misionesBreakingBad.push; // Ignorar, limpia
    frasesProstituta.push({
        texto: `Te contrataron para darle un servicio a ${clientes[i % clientes.length]} ${zonas[i % zonas.length]} y el sujeto ${motivosExito[i % motivosExito.length]}.`,
        tipo: "ganar"
    });
}

for (let i = 0; i < 20; i++) {
    frasesProstituta.push({
        texto: `Un encuentro con ${clientes[i % clientes.length]} ${zonas[i % zonas.length]} terminó mal cuando el tipo ${motivosFracaso[i % motivosFracaso.length]}.`,
        tipo: "perder"
    });
}
