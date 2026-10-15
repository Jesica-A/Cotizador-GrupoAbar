// ============ CONFIGURACIÓN ============
const FACTORES = [
  { nombre: "VISA / MASTERCARD / CABAL · 6",   factor: 1.27, cuotas: 6,  icono: "💳" },
  { nombre: "VISA / MASTERCARD / CABAL · 9",   factor: 1.50, cuotas: 9,  icono: "💳" },
  { nombre: "VISA / MASTERCARD / CABAL · 12",  factor: 1.68, cuotas: 12, icono: "💳" },
  { nombre: "AMERICAN EXPRESS · 6",            factor: 1.28, cuotas: 6,  icono: "💳" },
  { nombre: "AMERICAN EXPRESS · 9",            factor: 1.51, cuotas: 9,  icono: "💳" },
  { nombre: "AMERICAN EXPRESS · 12",           factor: 1.69, cuotas: 12, icono: "💳" },
  { nombre: "NARANJA X · 6",                   factor: 1.37, cuotas: 6,  icono: "🟠" },
  { nombre: "NARANJA X · 9",                   factor: 1.50, cuotas: 9,  icono: "🟠" },
  { nombre: "NARANJA X · 12",                  factor: 1.68, cuotas: 12, icono: "🟠" },
];

const FACTOR_3_CUOTAS = 1.20;
const DESCUENTO_POR_NEUMATICO = 5000;
const MIN_CANTIDAD_DESCUENTO = 4;
const DESCUENTO_SJYS = 0.30;
const DESCUENTO_ADICIONAL = 0.04;
const AJUSTE_BASE = 20000;
const AJUSTE_ALTO = 30000;

const CONTACTO = {
  direccion: "Rincón 1015, B° General Paz (atrás de super La Anónima)",
  rodrigo: "+54 9 351 350 4551",
  taller: "+54 9 351 8736709",
  validez: "Precios válidos hasta el último día del mes vigente",
};

// ============ UTILIDADES ============
function redondearArriba(n) {
  return Math.ceil(n / 1000) * 1000;
}

function fmt(n) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

/**
 * Parsea un precio escrito en cualquier formato:
 *  - 144438,43  → 144438.43
 *  - 144.438,43 → 144438.43
 *  - 144438.43  → 144438.43
 *  - 144.438.43 → 144438.43
 *  - 160000     → 160000
 *  - 1.234.567,89 → 1234567.89
 */
function parsearPrecio(valor) {
  if (valor === null || valor === undefined) return 0;
  const limpio = valor.toString()
    .replace(/\./g, "")   // saca puntos de miles
    .replace(/,.*$/, "")  // saca todo lo que venga después de una coma
    .trim();
  const n = parseFloat(limpio);
  return isNaN(n) ? 0 : n;
}

function analizarModelo(texto) {
  const t = texto.toUpperCase();
  let marca = "OTRA";
  if (/WANLI/.test(t)) marca = "WANLI";
  else if (/SUNNY/.test(t)) marca = "SUNNY";
  else if (/GITI/.test(t)) marca = "GITI";
  else if (/GOODYEAR|GOOD YEAR/.test(t)) marca = "GOODYEAR";

  const match = t.match(/(\d{3})\s*\/\s*\d{2}\s*R?\s*\d{2}/);
  let primeros3 = null;
  if (match) primeros3 = parseInt(match[1], 10);

  return { marca, primeros3 };
}

function calcularAjuste(marca, primeros3) {
  if (marca === "WANLI" || marca === "SUNNY") return AJUSTE_BASE;
  if (marca === "GITI" || marca === "GOODYEAR") {
    if (primeros3 === null) return AJUSTE_BASE;
    return primeros3 >= 200 ? AJUSTE_ALTO : AJUSTE_BASE;
  }
  return AJUSTE_BASE;
}

// ============ CÁLCULO PRINCIPAL ============
function calcular() {
  const modelo = document.getElementById("modelo").value.trim();
  const sjyS = parsearPrecio(document.getElementById("sjyS").value);
  const cantidad = parseInt(document.getElementById("cantidad").value) || 0;

  if (!modelo || sjyS <= 0 || cantidad <= 0) {
    document.getElementById("preview").textContent = "Cargá los datos para ver la cotización...";
    return;
  }

  const { marca, primeros3 } = analizarModelo(modelo);
  const ajuste = calcularAjuste(marca, primeros3);

  const costo30d = redondearArriba(sjyS * (1 - DESCUENTO_SJYS) * (1 - DESCUENTO_ADICIONAL));
  const efectivoUnit = redondearArriba(costo30d + ajuste);

  let efectivoTotal = efectivoUnit * cantidad;

  let descuento = 0;
  if (cantidad >= MIN_CANTIDAD_DESCUENTO) {
    descuento = DESCUENTO_POR_NEUMATICO * cantidad;
    efectivoTotal -= descuento;
  }
  efectivoTotal = redondearArriba(efectivoTotal);

  let txt = `*GRUPO ABAR NEUMÁTICOS · COTIZACIÓN*\n`;
  txt += `*Marca/Modelo:* ${modelo}\n`;
  txt += `*Cantidad:* ${cantidad} neumático${cantidad > 1 ? "s" : ""}\n\n`;
  txt += `*FORMA DE PAGO — TOTAL*\n\n`;

  // 3 cuotas sin interés (se muestra primero)
const total3c = redondearArriba(efectivoTotal * FACTOR_3_CUOTAS);
const cuota3c = redondearArriba(total3c / 3);
txt += `💳 *3 CUOTAS SIN INTERÉS:* ${fmt(total3c)}\n`;
txt += `   ↳ 3 cuotas de ${fmt(cuota3c)}\n\n`;

// Resto de los planes, agrupados por tarjeta
const planesAgrupados = {};
FACTORES.forEach(p => {
  // Extraer el nombre de la tarjeta (lo que está antes del "·")
  const partes = p.nombre.split("·");
  const tarjeta = partes[0].trim();

  if (!planesAgrupados[tarjeta]) {
    planesAgrupados[tarjeta] = { icono: p.icono, items: [] };
  }
  const total = redondearArriba(efectivoTotal * p.factor);
  const cuota = redondearArriba(total / p.cuotas);
  planesAgrupados[tarjeta].items.push({ cuotas: p.cuotas, total, cuota });
});

// Imprimir agrupado
Object.entries(planesAgrupados).forEach(([tarjeta, data]) => {
  txt += `${data.icono} *${tarjeta}*\n`;
  data.items.forEach(item => {
    txt += `   • ${item.cuotas} cuotas de ${fmt(item.cuota)} (total ${fmt(item.total)})\n`;
  });
  txt += `\n`;
});

  txt += `💵 *EFECTIVO / TRANSFERENCIA:* ${fmt(efectivoTotal)}\n`;
  if (descuento > 0) {
    txt += `   ↳ Incluye descuento de ${fmt(descuento)} por ${cantidad} neumáticos\n`;
  }

  txt += `\n`;
  txt += `📍 ${CONTACTO.direccion}\n`;
  txt += `📱 Rodrigo: ${CONTACTO.rodrigo}\n`;
  txt += `📱 Taller: ${CONTACTO.taller}\n`;
  txt += `⏳ ${CONTACTO.validez}`;

  document.getElementById("preview").textContent = txt;
}

// ============ COPIAR ============
function copiar() {
  const texto = document.getElementById("preview").textContent;
  navigator.clipboard.writeText(texto).then(() => {
    const btn = document.getElementById("btnCopiar");
    const original = btn.textContent;
    btn.textContent = "✅ ¡Copiado!";
    setTimeout(() => btn.textContent = original, 1500);
  }).catch(() => {
    alert("No se pudo copiar automáticamente. Seleccioná el texto y copialo a mano.");
  });
}

// ============ EVENTOS ============
document.querySelectorAll("input").forEach(i => i.addEventListener("input", calcular));
document.getElementById("btnCopiar").addEventListener("click", copiar);
calcular();