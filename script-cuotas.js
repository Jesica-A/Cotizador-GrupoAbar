// ============ CONFIGURACIÓN ============
const COMISION_PROMO_3CUOTAS = 0.03;
const FACTOR_CORDOBA_9CUOTAS = 1.242366;

const FACTORES_CUOTAS = [
  { plan: "VISA / MASTERCARD / CABAL", cuotas: 1,  factor: 1.030928, icono: "💳" }, 
  { plan: "VISA / MASTERCARD / CABAL", cuotas: 3,  factor: 1.1560,   icono: "💳" },
  { plan: "VISA / MASTERCARD / CABAL", cuotas: 6,  factor: 1.2650,   icono: "💳" },
  { plan: "VISA / MASTERCARD / CABAL", cuotas: 9,  factor: 1.4971,   icono: "💳" },
  { plan: "VISA / MASTERCARD / CABAL", cuotas: 12, factor: 1.6800,   icono: "💳" },
  { plan: "AMERICAN EXPRESS",          cuotas: 1,  factor: 1.030928, icono: "💳" }, 
  { plan: "AMERICAN EXPRESS",          cuotas: 3,  factor: 1.1670,   icono: "💳" },
  { plan: "AMERICAN EXPRESS",          cuotas: 6,  factor: 1.2770,   icono: "💳" },
  { plan: "AMERICAN EXPRESS",          cuotas: 9,  factor: 1.5100,   icono: "💳" },
  { plan: "AMERICAN EXPRESS",          cuotas: 12, factor: 1.6900,   icono: "💳" },
  { plan: "NARANJA X",                 cuotas: 1,  factor: 1.0714,   icono: "🟠" }, 
  { plan: "NARANJA X",                 cuotas: 3,  factor: 1.1429,   icono: "🟠" },
  { plan: "NARANJA X",                 cuotas: 6,  factor: 1.2967,   icono: "🟠" },
  { plan: "NARANJA X",                 cuotas: 9,  factor: 1.4971,   icono: "🟠" },
  { plan: "NARANJA X",                 cuotas: 12, factor: 1.6712,   icono: "🟠" },
];

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

function parsearPrecio(valor) {
  if (!valor) return 0;
  const limpio = valor.toString().replace(/\./g, "").replace(/,.*$/, "").trim();
  const n = parseFloat(limpio);
  return isNaN(n) ? 0 : n;
}

// ============ CÁLCULO PRINCIPAL ============
function calcular() {
  const montoRaw = parsearPrecio(document.getElementById("monto").value);
  const totalEfectivo = montoRaw > 0 ? Math.floor(montoRaw / 1000) * 1000 : 0;

  if (totalEfectivo <= 0) {
    document.getElementById("preview").textContent = "Cargá el monto para ver las cuotas...";
    return;
  }

  const pagoParcial = parsearPrecio(document.getElementById("pagoEfectivoParcial").value);
  let saldoTarjeta = totalEfectivo - pagoParcial;
  if (saldoTarjeta < 0) saldoTarjeta = 0;

  let txt = `*GRUPO ABAR · PLANES DE PAGO*\n\n`;

  if (pagoParcial > 0) {
    txt += `💵 *PAGO PARCIAL EN EFECTIVO / TRANSF:* ${fmt(pagoParcial)}\n`;
    txt += `💳 *SALDO A FINANCIAR:* ${fmt(saldoTarjeta)}\n\n`;
    txt += `_Los planes a continuación se calculan sobre el saldo de ${fmt(saldoTarjeta)}:_\n\n`;
  } else {
    txt += `💵 *EFECTIVO / TRANSFERENCIA:* ${fmt(totalEfectivo)}\n\n`;
  }

  // Promo 3 cuotas (Miércoles y Sábados)
  if (saldoTarjeta > 0) {
    const totalPromo = Math.round(saldoTarjeta / (1 - COMISION_PROMO_3CUOTAS));
    const cuotaPromo = Math.round(totalPromo / 3); 
    txt += `✨ *PROMO MIÉRCOLES Y SÁBADOS* ✨\n`;
    txt += `💳 *VISA / MASTERCARD · 3 CUOTAS SIN INTERÉS*\n`;
    txt += `   ↳ 3 cuotas de ${fmt(cuotaPromo)} (Precio de lista: ${fmt(totalPromo)})\n\n`;

    // Plan Cordobesa 9 cuotas
    const totalCordoba = Math.round(saldoTarjeta * FACTOR_CORDOBA_9CUOTAS);
    const cuotaCordoba = Math.round(totalCordoba / 9);
    txt += `🏛️ *PROMO 9 CUOTAS CORDOBESA* 🏛️\n`;
    txt += `💳 *TARJETA CORDOBESA · 9 CUOTAS*\n`;
    txt += `   ↳ 9 cuotas de ${fmt(cuotaCordoba)} (Total: ${fmt(totalCordoba)})\n\n`;

    // Planes agrupados (Visa, Amex, Naranja)
    const planesAgrupados = {};
    FACTORES_CUOTAS.forEach(f => {
      if (!planesAgrupados[f.plan]) {
        planesAgrupados[f.plan] = { icono: f.icono, items: [] };
      }
      const total = Math.round(saldoTarjeta * f.factor);
      const cuota = Math.round(total / f.cuotas);
      
      let aclaracion = "";
      if (f.plan.includes("VISA") && f.cuotas === 3) {
        aclaracion = " → _Resto de los días_";
      }
      
      planesAgrupados[f.plan].items.push({ cuotas: f.cuotas, total, cuota, aclaracion });
    });

    Object.entries(planesAgrupados).forEach(([plan, data]) => {
      txt += `${data.icono} *${plan}*\n`;
      data.items.forEach(item => {
        if (item.cuotas === 1) {
          txt += `   • 1 pago: ${fmt(item.total)}\n`;
        } else {
          txt += `   • ${item.cuotas} cuotas de ${fmt(item.cuota)} (total ${fmt(item.total)})${item.aclaracion}\n`;
        }
      });
      txt += `\n`;
    });
  }

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
document.getElementById("monto").addEventListener("input", calcular);
document.getElementById("pagoEfectivoParcial").addEventListener("input", calcular);
document.getElementById("btnCopiar").addEventListener("click", copiar);

// ============ INIT ============
calcular();