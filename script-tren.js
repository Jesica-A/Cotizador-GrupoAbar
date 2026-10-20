// ============ CONFIGURACIÓN ============
const AUMENTO_AMORTIGUADOR = 10000;
const COMISION_PROMO_3CUOTAS = 0.03;

const TRAMOS_AUMENTO = [
  { max: 15000,  tipo: "porcentaje", valor: 0.50 },
  { max: 30000,  tipo: "porcentaje", valor: 0.40 },
  { max: 60000,  tipo: "porcentaje", valor: 0.30 },
  { max: 70000,  tipo: "porcentaje", valor: 0.20 },
  { max: Infinity, tipo: "fijo", valor: 10000 },
];

const SERVICIOS_FIJOS = {
  auto: [
    { id: "promo",        nombre: "Promo (alineado + 4 balanceos)", precio: 45000, conCantidad: false },
    { id: "alineado",     nombre: "Alineado",                       precio: 35000, conCantidad: false },
    { id: "balanceo",     nombre: "Balanceo",                       precio: 8500,  conCantidad: true  },
    { id: "arme_desarme", nombre: "Arme y desarme",                 precio: 8500,  conCantidad: true  },
    { id: "arme",         nombre: "Arme",                           precio: 5000,  conCantidad: true  },
    { id: "rotacion",     nombre: "Rotación",                       precio: 20000, conCantidad: false },
    { id: "4armes4bal",   nombre: "4 armes + 4 balanceos",          precio: 50000, conCantidad: false },
    { id: "4ayd4bal",     nombre: "4 arme/desarme + 4 balanceos",   precio: 65000, conCantidad: false },
  ],
  camioneta: [
    { id: "promo",        nombre: "Promo (alineado + 4 balanceos)", precio: 60000, conCantidad: false },
    { id: "alineado",     nombre: "Alineado",                       precio: 45000, conCantidad: false },
    { id: "balanceo",     nombre: "Balanceo",                       precio: 10000, conCantidad: true  },
    { id: "arme_desarme", nombre: "Arme y desarme",                 precio: 10000, conCantidad: true  },
    { id: "arme",         nombre: "Arme",                           precio: 5000,  conCantidad: true  },
    { id: "rotacion",     nombre: "Rotación",                       precio: 30000, conCantidad: false },
    { id: "4armes4bal",   nombre: "4 armes + 4 balanceos",          precio: 60000, conCantidad: false },
    { id: "4ayd4bal",     nombre: "4 arme/desarme + 4 balanceos",   precio: 80000, conCantidad: false },
  ],
};

const FACTORES_CUOTAS = [
  { plan: "VISA / MASTERCARD / CABAL", cuotas: 1,  factor: 1.0250, icono: "💳" },
  { plan: "VISA / MASTERCARD / CABAL", cuotas: 3,  factor: 1.1560, icono: "💳" },
  { plan: "VISA / MASTERCARD / CABAL", cuotas: 6,  factor: 1.2650, icono: "💳" },
  { plan: "VISA / MASTERCARD / CABAL", cuotas: 9,  factor: 1.4971, icono: "💳" },
  { plan: "VISA / MASTERCARD / CABAL", cuotas: 12, factor: 1.6800, icono: "💳" },
  { plan: "AMERICAN EXPRESS",          cuotas: 1,  factor: 1.0340, icono: "💳" },
  { plan: "AMERICAN EXPRESS",          cuotas: 3,  factor: 1.1670, icono: "💳" },
  { plan: "AMERICAN EXPRESS",          cuotas: 6,  factor: 1.2770, icono: "💳" },
  { plan: "AMERICAN EXPRESS",          cuotas: 9,  factor: 1.5100, icono: "💳" },
  { plan: "AMERICAN EXPRESS",          cuotas: 12, factor: 1.6900, icono: "💳" },
  { plan: "NARANJA X",                 cuotas: 1,  factor: 1.0714, icono: "🟠" },
  { plan: "NARANJA X",                 cuotas: 3,  factor: 1.1429, icono: "🟠" },
  { plan: "NARANJA X",                 cuotas: 6,  factor: 1.2967, icono: "🟠" },
  { plan: "NARANJA X",                 cuotas: 9,  factor: 1.4971, icono: "🟠" },
  { plan: "NARANJA X",                 cuotas: 12, factor: 1.6712, icono: "🟠" },
];

const CONTACTO = {
  direccion: "Rincón 1015, B° General Paz (atrás de super La Anónima)",
  rodrigo: "+54 9 351 350 4551",
  taller: "+54 9 351 8736709",
  validez: "Precios válidos hasta el último día del mes vigente",
};

let repuestoIdCounter = 0;
let moIdCounter = 0;

// ============ UTILIDADES ============
function redondearArriba(n) {
  return Math.ceil(n / 1000) * 1000;
}

function fmt(n) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

function parsearPrecio(valor) {
  if (valor === null || valor === undefined) return 0;
  const limpio = valor.toString().replace(/\./g, "").replace(/,.*$/, "").trim();
  const n = parseFloat(limpio);
  return isNaN(n) ? 0 : n;
}

function esAmortiguador(desc) {
  return /amortiguad/i.test(desc);
}

function calcularPrecioVenta(descripcion, costo) {
  if (esAmortiguador(descripcion)) return costo + AUMENTO_AMORTIGUADOR;
  for (const t of TRAMOS_AUMENTO) {
    if (costo <= t.max) {
      if (t.tipo === "porcentaje") return costo * (1 + t.valor);
      return costo + t.valor;
    }
  }
  return costo;
}

// ============ ZONAS ============
function crearZona(titulo, mostrarEliminar) {
  const id = "zona-" + titulo.toLowerCase().replace(/\s+/g, "-");
  const html = `
    <div class="zona" id="${id}" data-titulo="${titulo}">
      <div class="zona-header">
        <div class="zona-titulo-fijo">${titulo}</div>
        ${mostrarEliminar ? `<button type="button" class="btn-eliminar-zona" title="Eliminar zona">✕</button>` : ""}
      </div>

      <div class="zona-seccion">
        <div class="zona-subtitulo">Repuestos</div>
        <div class="repuestos-lista" data-rol="repuestos"></div>
        <button type="button" class="boton-secundario btn-agregar-repuesto">➕ Agregar repuesto</button>
      </div>

      <div class="zona-seccion">
        <div class="zona-subtitulo">Mano de obra</div>
        <div class="mo-lista" data-rol="mo"></div>
        <button type="button" class="boton-secundario btn-agregar-mo">➕ Agregar mano de obra</button>
      </div>

      <div class="zona-subtotal" data-rol="subtotal">Subtotal ${titulo}: $0</div>
    </div>
  `;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html.trim();
  const zona = wrapper.firstChild;

  const btnEliminar = zona.querySelector(".btn-eliminar-zona");
  if (btnEliminar) {
    btnEliminar.addEventListener("click", () => {
      zona.remove();
      calcular();
    });
  }

  zona.querySelector(".btn-agregar-repuesto").addEventListener("click", () => {
    agregarRepuesto(zona);
    calcular();
  });

  zona.querySelector(".btn-agregar-mo").addEventListener("click", () => {
    agregarMO(zona);
    calcular();
  });

  document.getElementById("zonas").appendChild(zona);
  return zona;
}

function renderZonas() {
  const seleccion = document.querySelector('input[name="zonas"]:checked').value;
  const contenedor = document.getElementById("zonas");
  contenedor.innerHTML = "";

  if (seleccion === "delantero") {
    const z = crearZona("Tren Delantero", false);
    agregarRepuesto(z);
    agregarMO(z);
  } else if (seleccion === "trasero") {
    const z = crearZona("Tren Trasero", false);
    agregarRepuesto(z);
    agregarMO(z);
  } else {
    const z1 = crearZona("Tren Delantero", false);
    agregarRepuesto(z1);
    agregarMO(z1);
    const z2 = crearZona("Tren Trasero", false);
    agregarRepuesto(z2);
    agregarMO(z2);
  }
  calcular();
}

function agregarRepuesto(zona) {
  const id = "rep-" + (++repuestoIdCounter);
  const html = `
    <div class="item-row repuesto" id="${id}">
      <div class="item-fila-1">
        <input type="text" class="rep-desc" placeholder="Descripción (ej: Amortiguador delantero)">
        <button type="button" class="btn-quitar-item">✕</button>
      </div>
      <div class="item-fila-2">
        <div>
          <label class="mini-label">Costo Abar</label>
          <input type="text" inputmode="decimal" class="rep-costo" placeholder="0">
        </div>
        <div>
          <label class="mini-label">Cantidad</label>
          <input type="number" class="rep-cant" value="1" min="1">
        </div>
        <div>
          <label class="mini-label">Venta u.</label>
          <div class="rep-venta solo-lectura">$0</div>
        </div>
        <div>
          <label class="mini-label">Subtotal</label>
          <div class="rep-subtotal solo-lectura">$0</div>
        </div>
      </div>
    </div>
  `;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html.trim();
  const item = wrapper.firstChild;

  item.querySelector(".btn-quitar-item").addEventListener("click", () => {
    item.remove();
    calcular();
  });

  zona.querySelector('[data-rol="repuestos"]').appendChild(item);
}

function agregarMO(zona) {
  const id = "mo-" + (++moIdCounter);
  const html = `
    <div class="item-row mano-obra" id="${id}">
      <div class="item-fila-1">
        <input type="text" class="mo-desc" placeholder="Descripción (ej: Cambio amortiguadores)">
        <button type="button" class="btn-quitar-item">✕</button>
      </div>
      <div class="item-fila-2 mo-fila">
        <div>
          <label class="mini-label">Monto por lado</label>
          <input type="text" inputmode="decimal" class="mo-monto" placeholder="0">
        </div>
        <div>
          <label class="mini-label">Lados</label>
          <select class="mo-lados">
            <option value="1">×1 (un lado)</option>
            <option value="2">×2 (ambos lados)</option>
          </select>
        </div>
        <div>
          <label class="mini-label">Subtotal</label>
          <div class="mo-subtotal solo-lectura">$0</div>
        </div>
      </div>
    </div>
  `;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html.trim();
  const item = wrapper.firstChild;

  item.querySelector(".btn-quitar-item").addEventListener("click", () => {
    item.remove();
    calcular();
  });

  zona.querySelector('[data-rol="mo"]').appendChild(item);
}

// ============ SERVICIOS ============
function renderServicios() {
  const tipo = document.querySelector('input[name="tipo"]:checked').value;
  const servicios = SERVICIOS_FIJOS[tipo];
  const cont = document.getElementById("servicios");

  const estadoPrevio = {};
  cont.querySelectorAll(".servicio-item").forEach(el => {
    const id = el.dataset.servicio;
    const cb = el.querySelector('input[type="checkbox"]');
    const cantInput = el.querySelector(".servicio-cant");
    estadoPrevio[id] = {
      checked: cb ? cb.checked : false,
      cant: cantInput ? cantInput.value : "1"
    };
  });

  cont.innerHTML = servicios.map(s => {
    const prev = estadoPrevio[s.id] || { checked: false, cant: "1" };
    const cantHtml = s.conCantidad
      ? `<input type="number" class="servicio-cant" value="${prev.cant}" min="1" data-precio="${s.precio}">`
      : "";
    return `
      <div class="servicio-item" data-servicio="${s.id}">
        <input type="checkbox" data-servicio="${s.id}" data-precio="${s.precio}" ${prev.checked ? "checked" : ""}>
        <span class="servicio-nombre">${s.nombre}</span>
        ${cantHtml}
        <span class="servicio-precio">${fmt(s.precio)}</span>
      </div>
    `;
  }).join("");

  cont.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener("change", calcular);
  });
  cont.querySelectorAll('.servicio-cant').forEach(inp => {
    inp.addEventListener("input", calcular);
  });
}

// ============ CÁLCULO PRINCIPAL ============
function calcular() {
  const zonas = document.querySelectorAll(".zona");
  let totalGeneral = 0;
  const detalleZonas = [];

  zonas.forEach(zona => {
    const titulo = zona.dataset.titulo;
    let subtotalZona = 0;
    const items = [];

    zona.querySelectorAll(".repuesto").forEach(r => {
      const desc = r.querySelector(".rep-desc").value.trim();
      const costo = parsearPrecio(r.querySelector(".rep-costo").value);
      const cant = parseInt(r.querySelector(".rep-cant").value) || 0;
      
      const ventaU = Math.round(calcularPrecioVenta(desc, costo));
      const subtotal = ventaU * cant;

      r.querySelector(".rep-venta").textContent = fmt(ventaU);
      r.querySelector(".rep-subtotal").textContent = fmt(subtotal);

      if (desc && costo > 0 && cant > 0) {
        subtotalZona += subtotal;
        items.push(`• ${desc} (x${cant}): ${fmt(subtotal)}`);
      }
    });

    zona.querySelectorAll(".mano-obra").forEach(m => {
      const desc = m.querySelector(".mo-desc").value.trim() || "Mano de obra";
      const monto = parsearPrecio(m.querySelector(".mo-monto").value);
      const lados = parseInt(m.querySelector(".mo-lados").value) || 1;
      const subtotal = monto * lados;

      m.querySelector(".mo-subtotal").textContent = fmt(subtotal);

      if (monto > 0) {
        const etiqueta = lados === 2 ? " (x2 lados)" : " (1 lado)";
        subtotalZona += subtotal;
        items.push(`• ${desc}${etiqueta}: ${fmt(subtotal)}`);
      }
    });

    zona.querySelector('[data-rol="subtotal"]').textContent = `Subtotal ${titulo}: ${fmt(subtotalZona)}`;

    if (subtotalZona > 0 || items.length > 0) {
      detalleZonas.push({ titulo, items, subtotal: subtotalZona });
    }
    totalGeneral += subtotalZona;
  });

  // Servicios
  let totalServicios = 0;
  const serviciosMarcados = [];
  document.querySelectorAll('#servicios .servicio-item').forEach(el => {
    const cb = el.querySelector('input[type="checkbox"]');
    if (!cb || !cb.checked) return;
    const nombre = el.querySelector(".servicio-nombre").textContent;
    const precio = parseFloat(cb.dataset.precio);
    const cantInput = el.querySelector(".servicio-cant");
    const cant = cantInput ? (parseInt(cantInput.value) || 1) : 1;
    const subtotal = precio * cant;
    totalServicios += subtotal;
    const cantTxt = cant > 1 ? ` (x${cant})` : "";
    serviciosMarcados.push(`• ${nombre}${cantTxt}: ${fmt(subtotal)}`);
  });

  // TOTAL EXACTO (Redondeo hacia abajo)
  const totalEfectivoRaw = totalGeneral + totalServicios;
  const totalEfectivo = totalEfectivoRaw > 0 ? Math.floor(totalEfectivoRaw / 1000) * 1000 : 0;

  document.getElementById("totalGeneral").textContent = fmt(totalEfectivo);

  // Armar mensaje
  const cliente = document.getElementById("cliente").value.trim();
  if (detalleZonas.length === 0 && serviciosMarcados.length === 0) {
    document.getElementById("preview").textContent = "Cargá los datos para ver el presupuesto...";
    return;
  }

  let txt = `*GRUPO ABAR · PRESUPUESTO TALLER*\n`;
  if (cliente) txt += `*Vehículo:* ${cliente}\n`;
  txt += `\n`;

  // ZONAS (Sin subtotales)
  detalleZonas.forEach(z => {
    txt += `*🔧 ${z.titulo.toUpperCase()}*\n`;
    z.items.forEach(i => txt += i + "\n");
    txt += `\n`;
  });

  // SERVICIOS (Sin subtotales)
  if (serviciosMarcados.length > 0) {
    txt += `*🛠️ SERVICIOS GENERALES*\n`;
    serviciosMarcados.forEach(s => txt += s + "\n");
    txt += `\n`;
  }

  // --- FORMA DE PAGO ---
  txt += `*FORMA DE PAGO*\n\n`;

  const pagoParcial = parsearPrecio(document.getElementById("pagoEfectivoParcial").value);
  let saldoTarjeta = totalEfectivo - pagoParcial;
  if (saldoTarjeta < 0) saldoTarjeta = 0;

  // Promo 3 cuotas (sobre saldoTarjeta)
  if (saldoTarjeta > 0) {
    const totalPromo = redondearArriba(saldoTarjeta / (1 - COMISION_PROMO_3CUOTAS));
    const cuotaPromo = Math.round(totalPromo / 3); 
    
    txt += `✨ *PROMO MIÉRCOLES Y SÁBADOS* ✨\n`;
    txt += `💳 *VISA / MASTERCARD · 3 CUOTAS SIN INTERÉS*\n`;
    txt += `   ↳ 3 cuotas de ${fmt(cuotaPromo)} (Precio de lista: ${fmt(totalPromo)})\n\n`;
  }

  // Efectivo
  if (pagoParcial > 0) {
    txt += `💵 *PAGO PARCIAL EN EFECTIVO / TRANSF:* ${fmt(pagoParcial)}\n`;
    txt += `💳 *SALDO A FINANCIAR:* ${fmt(saldoTarjeta)}\n\n`;
    txt += `_Los planes de tarjeta a continuación se calculan sobre el saldo de ${fmt(saldoTarjeta)}:_\n\n`;
  } else {
    txt += `💵 *EFECTIVO / TRANSFERENCIA:* ${fmt(totalEfectivo)}\n\n`;
  }

  // Planes agrupados (sobre saldoTarjeta)
  const planesAgrupados = {};
  FACTORES_CUOTAS.forEach(f => {
    if (!planesAgrupados[f.plan]) {
      planesAgrupados[f.plan] = { icono: f.icono, items: [] };
    }
    const total = redondearArriba(saldoTarjeta * f.factor);
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

  txt += `🛡️ *GARANTÍAS:*\n`;
  txt += `• Repuestos en general: 1 mes (fábrica)\n`;
  txt += `• Amortiguadores: 1 año (fábrica)\n`;
  txt += `• Mano de obra: mismo tiempo que los repuestos\n\n`;
  
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

// ============ GUARDAR PDF INTERNO ============
document.getElementById("btnGuardarPDF").addEventListener("click", () => {
  const cliente = document.getElementById("cliente").value.trim() || "Sin_nombre";
  
  let html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #000;">
      <h2 style="color: #c8102e; margin-bottom: 5px;">GRUPO ABAR · PRESUPUESTO INTERNO</h2>
      <p style="margin-top: 0; font-size: 14px; color: #555;">Solo para uso interno (Incluye costo Abar)</p>
      <hr style="border: 1px solid #ccc; margin: 15px 0;">
      <p><strong>Vehículo:</strong> ${cliente.replace(/_/g, " ")}</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleDateString("es-AR")}</p>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; margin-top: 15px;">
        <thead>
          <tr style="background: #eee;">
            <th style="padding: 8px; border: 1px solid #ccc;">Ítem / Repuesto</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Costo Abar</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Venta Unit.</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Subtotal Venta</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Recorremos las zonas para buscar los costos y ventas
  document.querySelectorAll(".zona").forEach(zona => {
    zona.querySelectorAll(".repuesto").forEach(r => {
      const desc = r.querySelector(".rep-desc").value.trim();
      const costo = r.querySelector(".rep-costo").value;
      const cant = r.querySelector(".rep-cant").value;
      const ventaU = r.querySelector(".rep-venta").textContent;
      const subtotal = r.querySelector(".rep-subtotal").textContent;
      
      if (desc && costo) {
        html += `
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc;">${desc} (x${cant})</td>
            <td style="padding: 8px; border: 1px solid #ccc;">$${costo}</td>
            <td style="padding: 8px; border: 1px solid #ccc;">${ventaU}</td>
            <td style="padding: 8px; border: 1px solid #ccc;">${subtotal}</td>
          </tr>
        `;
      }
    });
  });

  // Calcular Ganancia Total
  const totalVentaTexto = document.getElementById("totalGeneral").textContent;
  const totalVenta = parseInt(totalVentaTexto.replace(/[$.]/g, ''), 10) || 0;

  let totalCosto = 0;

  document.querySelectorAll(".zona .repuesto").forEach(r => {
    const costo = parsearPrecio(r.querySelector(".rep-costo").value);
    const cant = parseInt(r.querySelector(".rep-cant").value) || 0;
    totalCosto += (costo * cant);
  });

  const ganancia = totalVenta - totalCosto;

  html += `
        </tbody>
      </table>
      <div style="text-align: right; margin-top: 20px;">
        <h3 style="margin: 5px 0;">TOTAL EFECTIVO (Venta): ${document.getElementById("totalGeneral").textContent}</h3>
        <h3 style="margin: 5px 0; color: #c8102e;">GANANCIA ABAR (aprox): ${fmt(ganancia)}</h3>
      </div>
    </div>
  `;

  // Abrimos una ventana nueva invisible
  const printWindow = window.open('', '_blank');
  
  // Le inyectamos el HTML con los datos
  printWindow.document.write(`
    <html>
      <head>
        <title>Presupuesto Interno - ${cliente.replace(/_/g, " ")}</title>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);
  
  // Abrimos el diálogo de impresión
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
});

// ============ EVENTOS ============
document.getElementById("btnCopiar").addEventListener("click", copiar);
document.getElementById("pagoEfectivoParcial").addEventListener("input", calcular);

document.querySelectorAll('input[name="tipo"]').forEach(r => {
  r.addEventListener("change", () => {
    renderServicios();
    calcular();
  });
});

document.querySelectorAll('input[name="zonas"]').forEach(r => {
  r.addEventListener("change", renderZonas);
});

document.addEventListener("input", (e) => {
  if (e.target.closest("#zonas") || e.target.id === "cliente") {
    calcular();
  }
});

document.addEventListener("change", (e) => {
  if (e.target.classList.contains("mo-lados")) {
    calcular();
  }
});

// ============ INIT (Al cargar la página) ============
document.addEventListener("DOMContentLoaded", () => {
  renderServicios();
  
  // Usamos un pequeño timeout para que el navegador termine de armar el HTML
  // y no se "coma" las cajas de repuestos y mano de obra.
  setTimeout(() => {
    renderZonas();
    calcular();
  }, 50);
});