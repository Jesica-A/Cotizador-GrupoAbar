// ============ CONFIGURACIÓN ============
const AUMENTO_AMORTIGUADOR = 10000;

const TRAMOS_AUMENTO = [
  { max: 15000,  tipo: "porcentaje", valor: 0.50 },
  { max: 30000,  tipo: "porcentaje", valor: 0.40 },
  { max: 60000,  tipo: "porcentaje", valor: 0.30 },
  { max: 70000,  tipo: "porcentaje", valor: 0.20 },
  { max: Infinity, tipo: "fijo", valor: 10000 },
];

// conCantidad: true → muestra input de cantidad y multiplica
const SERVICIOS_FIJOS = {
  auto: [
    { id: "promo",        nombre: "Promo (alineado + 4 balanceos)", precio: 45000, conCantidad: false },
    { id: "alineado",     nombre: "Alineado",                       precio: 35000, conCantidad: false },
    { id: "balanceo",     nombre: "Balanceo",                       precio: 8500,  conCantidad: true  },
    { id: "arme_desarme", nombre: "Arme y desarme",                 precio: 8500,  conCantidad: true  },
    { id: "arme",         nombre: "Arme",                           precio: 5000,  conCantidad: true  },
    { id: "rotacion",     nombre: "Rotación",                       precio: 20000, conCantidad: false },
    { id: "4armes4bal",   nombre: "4 armes + 4 balanceos",          precio: 50000, conCantidad: false },
    { id: "4ayd4bal",     nombre: "4 arme/desarme + 4 balanceos",   precio: 60000, conCantidad: false },
  ],
  camioneta: [
    { id: "promo",        nombre: "Promo (alineado + 4 balanceos)", precio: 55000, conCantidad: false },
    { id: "alineado",     nombre: "Alineado",                       precio: 45000, conCantidad: false },
    { id: "balanceo",     nombre: "Balanceo",                       precio: 10000, conCantidad: true  },
    { id: "arme_desarme", nombre: "Arme y desarme",                 precio: 10000, conCantidad: true  },
    { id: "arme",         nombre: "Arme",                           precio: 5000,  conCantidad: true  },
    { id: "rotacion",     nombre: "Rotación",                       precio: 30000, conCantidad: false },
    { id: "4armes4bal",   nombre: "4 armes + 4 balanceos",          precio: 60000, conCantidad: false },
    { id: "4ayd4bal",     nombre: "4 arme/desarme + 4 balanceos",   precio: 70000, conCantidad: false },
  ],
};

const FACTORES_CUOTAS = [
  { plan: "VISA / MASTERCARD / CABAL", cuotas: 1,  interes: 0.0250, icono: "💳" },
  { plan: "VISA / MASTERCARD / CABAL", cuotas: 3,  interes: 0.1560, icono: "💳" },
  { plan: "VISA / MASTERCARD / CABAL", cuotas: 6,  interes: 0.2650, icono: "💳" },
  { plan: "VISA / MASTERCARD / CABAL", cuotas: 9,  interes: 0.5000, icono: "💳" },
  { plan: "VISA / MASTERCARD / CABAL", cuotas: 12, interes: 0.6800, icono: "💳" },
  { plan: "AMERICAN EXPRESS",          cuotas: 1,  interes: 0.0340, icono: "💳" },
  { plan: "AMERICAN EXPRESS",          cuotas: 3,  interes: 0.1670, icono: "💳" },
  { plan: "AMERICAN EXPRESS",          cuotas: 6,  interes: 0.2770, icono: "💳" },
  { plan: "AMERICAN EXPRESS",          cuotas: 9,  interes: 0.5100, icono: "💳" },
  { plan: "AMERICAN EXPRESS",          cuotas: 12, interes: 0.6900, icono: "💳" },
  { plan: "NARANJA X",                 cuotas: 1,  interes: 0.0800, icono: "🟠" },
  { plan: "NARANJA X",                 cuotas: 3,  interes: 0.1500, icono: "🟠" },
  { plan: "NARANJA X",                 cuotas: 6,  interes: 0.2600, icono: "🟠" },
  { plan: "NARANJA X",                 cuotas: 12, interes: 0.6800, icono: "🟠" },
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

  // Guardar estado anterior
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
      const ventaU = calcularPrecioVenta(desc, costo);
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

  const descDiagnostico = document.getElementById("diagnostico").checked ? 10000 : 0;
  const totalEfectivoRaw = totalGeneral + totalServicios - descDiagnostico;
  const totalEfectivo = totalEfectivoRaw > 0 ? redondearArriba(totalEfectivoRaw) : 0;

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

  detalleZonas.forEach(z => {
    txt += `*🔧 ${z.titulo.toUpperCase()}*\n`;
    z.items.forEach(i => txt += i + "\n");
    txt += `*Subtotal: ${fmt(z.subtotal)}*\n\n`;
  });

  if (serviciosMarcados.length > 0) {
    txt += `*🛠️ SERVICIOS GENERALES*\n`;
    serviciosMarcados.forEach(s => txt += s + "\n");
    txt += `*Subtotal: ${fmt(totalServicios)}*\n\n`;
  }

  if (descDiagnostico > 0) {
    txt += `_Descuento por diagnóstico en nuestro taller: −${fmt(descDiagnostico)}_\n\n`;
  }

  txt += `*TOTAL EFECTIVO / TRANSFERENCIA: ${fmt(totalEfectivo)}*\n\n`;
  txt += `*FORMA DE PAGO*\n\n`;

// Agrupar por plan (tarjeta)
const planesAgrupados = {};
FACTORES_CUOTAS.forEach(f => {
  if (!planesAgrupados[f.plan]) {
    planesAgrupados[f.plan] = { icono: f.icono, items: [] };
  }
  const total = redondearArriba(totalEfectivo * (1 + f.interes));
  const cuota = redondearArriba(total / f.cuotas);
  planesAgrupados[f.plan].items.push({ cuotas: f.cuotas, total, cuota });
});

// Imprimir agrupado
Object.entries(planesAgrupados).forEach(([plan, data]) => {
  txt += `${data.icono} *${plan}*\n`;
  data.items.forEach(item => {
    if (item.cuotas === 1) {
      txt += `   • 1 pago: ${fmt(item.total)}\n`;
    } else {
      txt += `   • ${item.cuotas} cuotas de ${fmt(item.cuota)} (total ${fmt(item.total)})\n`;
    }
  });
  txt += `\n`;
});

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
document.getElementById("btnCopiar").addEventListener("click", copiar);

document.querySelectorAll('input[name="tipo"]').forEach(r => {
  r.addEventListener("change", () => {
    renderServicios();
    calcular();
  });
});

document.querySelectorAll('input[name="zonas"]').forEach(r => {
  r.addEventListener("change", renderZonas);
});

document.getElementById("diagnostico").addEventListener("change", calcular);

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

// ============ INIT ============
renderZonas();
renderServicios();
calcular();