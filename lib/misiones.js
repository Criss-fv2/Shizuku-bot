// ═════════════════════════════════════════════════════════════════
// DATABASE: Catálogo de 500 Operaciones Clandestinas 
// RUTA: lib/misiones.js
// ═════════════════════════════════════════════════════════════════

export const misionesBreakingBad = [
    // --- NÚCLEOS DE ÉXITO BASE (Formatos Icónicos) ---
    { texto: "Cocinaste 20 kg de metanfetamina junto a Walter White y la distribuiste por toda la ciudad logrando el control total.", tipo: "ganar" },
    { texto: "Jesse Pinkman coordinó una entrega masiva en los barrios bajos usando a Badger y Skinny Pete como distribuidores.", tipo: "ganar" },
    { texto: "Gustavo Fring autorizó un cargamento especial oculto en los camiones de Los Pollos Hermanos evadiendo los retenes.", tipo: "ganar" },
    { texto: "Saul Goodman armó una red de lavado impecable usando empresas fantasma y falsas donaciones en la red.", tipo: "ganar" },
    { texto: "Mike Ehrmantraut ejecutó una limpieza táctica eliminando a los matones del cartel que vigilaban tus bodegas.", tipo: "ganar" },
    { texto: "Robaste un barril entero de metilamina de un tren de carga en movimiento en el desierto junto a Todd Alquist.", tipo: "ganar" },
    { texto: "Lydia Rodarte-Quayle facilitó precursores químicos importados directamente desde los muelles de Madrigal Electromotive.", tipo: "ganar" },
    { texto: "Instalaste un laboratorio móvil usando la cobertura de control de plagas de Vamonos Pest cocinando sin dejar rastro.", tipo: "ganar" },
    { texto: "Huell Babineaux y Kuby aseguraron tus barriles llenos de efectivo guardándolos en un depósito subterráneo secreto.", tipo: "ganar" },
    { texto: "Gale Boetticher calibró los destiladores térmicos elevando la pureza del producto al 99.1% en el súper laboratorio.", tipo: "ganar" },

    
    { texto: "Hank Schrader y el equipo de la DEA interceptaron una entrega masiva tras rastrear una llamada interceptada.", tipo: "perder" },
    { texto: "Tuco Salamanca entró en un ataque de paranoia violenta destruyendo gran parte del equipo de filtrado en el desierto.", tipo: "perder" },
    { texto: "Los Primos Salamanca bloquearon las rutas fronterizas buscando venganza interrumpiendo tus cadenas de suministro.", tipo: "perder" },
    { texto: "Una mosca contaminó los tanques de destilación obligándote a desechar todo el lote químico por órdenes estrictas.", tipo: "perder" },
    { texto: "Héctor Salamanca usó sus contactos en Juárez para sabotear las transacciones financieras golpeando su campana de advertencia.", tipo: "perder" },
    { texto: "Gus Fring descubrió una insubordinación operativa en tu equipo y congeló tus pagos semanales como castigo inmediato.", tipo: "perder" },
    { texto: "Krazy-8 intentó traicionarte con un arma oculta durante un intercambio de mercancía en el patio de chatarra de Joe.", tipo: "perder" },
    { texto: "La banda de supremacistas de Jack Welker te emboscó en el desierto confiscando gran parte de tus ganancias netas.", tipo: "perder" },
    { texto: "El Servicio de Impuestos Internos (IRS) detectó desvíos masivos en el autolavado A1A obligándote a pagar multas pesadas.", tipo: "perder" },
    { texto: "Ted Beneke malgastó los fondos de emergencia que le entregaste llamando la atención de los auditores del gobierno.", tipo: "perder" }
];


const cantidades = ["10 kg", "25 kg", "50 kg", "100 kg", "150 kg", "200 kg", "350 kg", "500 kg"];
const socios = ["con Walter White", "con Jesse Pinkman", "junto al equipo de Heisenberg", "bajo la protección de Mike", "con la logística de Gus Fring", "asociado con Todd Alquist"];
const zonas = ["por toda la frontera", "en los suburbios de Albuquerque", "en las rutas controladas por el cartel", "en el mercado negro internacional", "en los laboratorios clandestinos del desierto", "por las esquinas de la red criminal"];
const detonantesExito = ["logrando ganancias brutales", "eliminando la competencia local", "dejando el mercado inundado de azul", "superando los estándares de pureza exigidos", "expandiendo el imperio sin dejar un solo rastro"];

const amenazas = ["un comando armado de la DEA", "los sicarios sobrevivientes de Juárez", "informantes infiltrados en el autolavado", "una investigación federal liderada por Hank Schrader", "una traición interna coordinada por un distribuidor arrestado"];
const consecuencias = ["obligándote a quemar la mercancía para salvar tu pellejo", "dejándote con deudas masivas en el mercado negro", "destruyendo los precursores químicos de reserva", "provocando pérdidas financieras críticas en tus cuentas", "forzándote a pagar millones a Saul Goodman para limpiar las pruebas"];


for (let i = 0; i < 240; i++) {
    let cant = cantidades[i % cantidades.length];
    let soc = socios[i % socios.length];
    let zon = zonas[i % zonas.length];
    let det = detonantesExito[i % detonantesExito.length];
    misionesBreakingBad.push({
        texto: `Cocinaste ${cant} de metanfetamina pura ${soc}, la distribuiste ${zon} y cerraste el trato ${det}.`,
        tipo: "ganar"
    });
}

for (let i = 0; i < 240; i++) {
    let cant = cantidades[i % cantidades.length];
    let soc = socios[i % socios.length];
    let am = amenazas[i % amenazas.length];
    let cons = consecuencias[i % consecuencias.length];
    misionesBreakingBad.push({
        texto: `Mientras movías un lote de ${cant} producido ${soc}, ${am} reventó el perímetro, ${cons}.`,
        tipo: "perder"
    });
}
