/* ═══════════════════════════════════════
   TABS LOGIC
   ═══════════════════════════════════════ */
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const tabIndicator = document.getElementById('tabIndicator');

function positionIndicator(button) {
  const bar = document.getElementById('tabsBar');
  const barRect = bar.getBoundingClientRect();
  const btnRect = button.getBoundingClientRect();
  tabIndicator.style.width = btnRect.width + 'px';
  tabIndicator.style.transform = `translateX(${btnRect.left - barRect.left - 5}px)`;

  if (button.dataset.tab === 'gratificacion') {
    tabIndicator.classList.add('grat');
  } else {
    tabIndicator.classList.remove('grat');
  }
}

function switchTab(tabName) {
  tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  tabContents.forEach(content => {
    content.classList.toggle('active', content.id === (tabName === 'cts' ? 'tabCts' : 'tabGratificacion'));
  });
  const activeBtn = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
  positionIndicator(activeBtn);
}

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Initialize indicator position
window.addEventListener('load', () => {
  const activeBtn = document.querySelector('.tab-button.active');
  if (activeBtn) positionIndicator(activeBtn);
});
window.addEventListener('resize', () => {
  const activeBtn = document.querySelector('.tab-button.active');
  if (activeBtn) positionIndicator(activeBtn);
});

/* ═══════════════════════════════════════
   SHARED UTILITIES
   ═══════════════════════════════════════ */
const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const hoy = new Date();

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(valor);
}

let activeAnimationFrames = [];

function cancelarAnimaciones() {
  activeAnimationFrames.forEach((id) => cancelAnimationFrame(id));
  activeAnimationFrames = [];
}

function parseNumero(texto) {
  const valor = Number(texto.replace(/[^0-9.-]+/g, ''));
  return Number.isNaN(valor) ? 0 : valor;
}

function animarValor(elemento, inicio, fin, duracion, formatear) {
  const inicioTiempo = performance.now();

  function paso(tiempoActual) {
    const transcurrido = tiempoActual - inicioTiempo;
    const progreso = Math.min(transcurrido / duracion, 1);
    const valor = inicio + (fin - inicio) * progreso;
    elemento.textContent = formatear(valor);

    if (progreso < 1) {
      const frameId = requestAnimationFrame(paso);
      activeAnimationFrames.push(frameId);
    }
  }

  const frameId = requestAnimationFrame(paso);
  activeAnimationFrames.push(frameId);
}

/* ═══════════════════════════════════════
   CTS CALCULATOR (existing logic)
   ═══════════════════════════════════════ */
const form = document.getElementById('ctsForm');
const fechaIngresoInput = document.getElementById('fechaIngreso');
const periodoInput = document.getElementById('periodo');
const sueldoBasicoInput = document.getElementById('sueldoBasico');
const asignacionInput = document.getElementById('asignacionFamiliar');
const inasistenciasInput = document.getElementById('inasistencias');

const mesesComputablesLabel = document.getElementById('mesesComputablesLabel');
const diasComputablesLabel = document.getElementById('diasComputablesLabel');
const sueldoBasicoLabel = document.getElementById('sueldoBasicoLabel');
const asignacionFamiliarLabel = document.getElementById('asignacionFamiliarLabel');
const gratificacionInput = document.getElementById('gratificacion');
const gratificacionLabel = document.getElementById('gratificacionLabel');
const horasExtrasLabel = document.getElementById('horasExtrasLabel');
const comisionesLabel = document.getElementById('comisionesLabel');
const ctsLabel = document.getElementById('ctsLabel');
const ctsCalculoLabel = document.getElementById('ctsCalculoLabel');
const descuentoInasistenciasLabel = document.getElementById('descuentoInasistenciasLabel');
const ctsPagarLabel = document.getElementById('ctsPagarLabel');

const resultadoCard = document.getElementById('resultadoCard');
const comisionesButton = document.getElementById('openComisionesModal');
const horasButton = document.getElementById('openHorasModal');
const modal = document.getElementById('registroModal');
const closeModalButton = document.getElementById('closeModal');
const modalForm = document.getElementById('modalForm');
const modalFields = document.getElementById('modalFields');
const modalTitle = document.getElementById('modalTitle');
const modalTypeLabel = document.getElementById('modalTypeLabel');
const modalTotal = document.getElementById('modalTotal');
const comisionesTotalInput = document.getElementById('comisionesTotal');
const horasExtrasTotalInput = document.getElementById('horasExtrasTotal');
const asignacionCheck = document.getElementById('asignacionCheck');
const comisionesHidden = document.getElementById('comisionesHidden');
const horasExtrasHidden = document.getElementById('horasExtrasHidden');

let currentMonths = 0;
let modalMode = null;
let comisionesMeses = [0, 0, 0, 0, 0, 0];
let horasMeses = [0, 0, 0, 0, 0, 0];
let fechasPeriodos = [];
let mesInicio = 0;

fechaIngresoInput.max = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

function calcularMeses(fechaIngreso,periodoSeleccionado) {
  if (!fechaIngreso) {
    return { meses: 0, dias: 0 };
  }

  const ingreso = new Date(fechaIngreso);
  if (Number.isNaN(ingreso.getTime())) {
    return { meses: 0, dias: 0 };
  }

  const periodo = fechasPeriodos.find(p => p.fin === periodoSeleccionado);
  const inicioPeriodo = new Date(periodo.inicio );
  const finPeriodo = new Date(periodo.fin);
  if (Number.isNaN(finPeriodo.getTime())) {
    return { meses: 0, dias: 0 };
  }

  if (ingreso > finPeriodo) {
    return { meses: 0, dias: 0 };
  }

  const inicio= ingreso > inicioPeriodo ? ingreso : inicioPeriodo;
  mesInicio = inicio.getUTCMonth();
  const aniosTotal = finPeriodo.getFullYear() - inicio.getUTCFullYear();
  const mesesTotal = inicio.getUTCDate()>1 ? finPeriodo.getMonth() - (inicio.getUTCMonth()+1) +1: finPeriodo.getMonth() - inicio.getUTCMonth()+1;
  let diasTotal =  0;
  let mesesComputables = aniosTotal * 12 + mesesTotal;

  if (inicio.getUTCDate()>1) {
    let ultimoDiasPrimerMes = new Date(inicio.getUTCFullYear(), inicio.getUTCMonth()+1, 0).getUTCDate();
    diasTotal = ultimoDiasPrimerMes-inicio.getUTCDate()+1;
}
  return { meses: mesesComputables, dias: diasTotal };
}

function updateRegistroState() {
  const currentTime = calcularMeses(fechaIngresoInput.value,periodoInput.value);
    currentMonths = currentTime.dias>0 ? currentTime.meses + 1 : currentTime.meses;
    animarValor(
        mesesComputablesLabel,
        parseNumero(mesesComputablesLabel.textContent),
        currentTime.meses,
        700,
        (valor) => `${Math.round(valor)} meses`
    );

    animarValor(
        diasComputablesLabel,
        parseNumero(diasComputablesLabel.textContent),
        currentTime.dias,
        300,
        (valor) => `${Math.round(valor)} días`
    );
}

function updatePeriodoState() {
  periodoInput.innerHTML = '';
  fechasPeriodos = [];
  const ingreso = new Date(fechaIngresoInput.value);
  if (Number.isNaN(ingreso.getTime())) {
    ingreso=hoy;
  }

  const anioIngreso =  ingreso.getUTCFullYear();
  const anioHoy =  hoy.getUTCFullYear();
  const mesIngreso =  ingreso.getUTCMonth();
  const mesHoy =  hoy.getUTCMonth();

  if(ingreso>hoy){
    alert('La fecha de ingreso no puede ser mayor a la fecha actual.');
    return;
  }


  for(let i=anioIngreso;i<=anioHoy;i++){
    if(i===anioIngreso && mesIngreso>3){
    }else{
        const option1 = document.createElement('option');
        option1.value = `${i}/04/30`;
        option1.textContent = `Mayo ${i} (Nov ${i-1} - Abr ${i})`;
        periodoInput.appendChild(option1);
        fechasPeriodos.push({ inicio: `${i-1}/11/01`, fin: `${i}/04/30` });
    }

    if(i===anioIngreso && mesIngreso>9){
    }else if(i===anioHoy && mesHoy<4){
    }else{
        const option2 = document.createElement('option');
        option2.value = `${i}/10/31`;
        option2.textContent = `Noviembre ${i} (May ${i} - Oct ${i})`;
        periodoInput.appendChild(option2);
        fechasPeriodos.push({ inicio: `${i}/05/01`, fin: `${i}/10/31` });
    }

    if(i===anioHoy && mesHoy>9){
        const option1 = document.createElement('option');
        option1.value = `${i+1}/04/30`;
        option1.textContent = `Mayo ${i+1} (Nov ${i} - Abr ${i+1})`;
        periodoInput.appendChild(option1);
        fechasPeriodos.push({ inicio: `${i}/11/01`, fin: `${i+1}/04/30` });
    }
  }

  periodoInput.selectedIndex = periodoInput.options.length - 1;

}

function toggleAsignacionFamiliar() {
  asignacionInput.value = asignacionCheck.checked ? 113 : 0;
}

function buildModalFields(mode) {
  const values = mode === 'comisiones' ? comisionesMeses : horasMeses;
  modalFields.innerHTML = '';

  const nMeses= currentMonths;


  for (let i = 0; i < nMeses; i += 1) {
    const wrapper = document.createElement('div');
    wrapper.className = 'modal-field';

    let mesNumber= i + mesInicio +1>12 ? i + mesInicio -12 : i + mesInicio;
    const label = document.createElement('span');
    label.textContent = meses[mesNumber];

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.step = '1';
    input.value = values[i];
    input.addEventListener('input', calculateModalTotal);

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    modalFields.appendChild(wrapper);
  }
}

function calculateModalTotal() {
  const total = Array.from(modalFields.querySelectorAll('input')).reduce((sum, input) => {
    return sum + Number(input.value || 0);
  }, 0);
  modalTotal.textContent = total;
  return total;
}

function openModal(mode) {
    
  if (fechaIngresoInput.value === '') {
    alert('Debes ingresar la fecha de ingreso.');
    return;
  }
  
  if (currentMonths < 3) {
    alert('Debes tener al menos 3 meses de antigüedad.');
    return;
  }

  modalMode = mode;
  modal.classList.remove('hidden');
  modalTypeLabel.textContent = mode === 'comisiones' ? 'Comisiones' : 'Horas extras';
  modalTitle.textContent = mode === 'comisiones' ? 'Registrar comisiones mes a mes' : 'Registrar horas extras mes a mes';
  buildModalFields(mode);
  calculateModalTotal();
}

function closeModal() {
  modal.classList.add('hidden');
}

function saveModalValues(event) {
  event.preventDefault();
  const inputs = Array.from(modalFields.querySelectorAll('input'));
  const values = inputs.map((input) => Number(input.value || 0));
  // Filtrar los valores que no son cero y contar cuántos hay
  const AlMenosTresMeses = values.filter(val => val !== 0).length >= 3;
  let total = 0;
  
  if (AlMenosTresMeses) {
    total = values.reduce((sum, value) => sum + value, 0);
  }else{
    alert('Debes ingresar valores en al menos 3 meses para que se considere en el cálculo. Se ha registrado un total de 0 para este concepto.');
  }

  if (modalMode === 'comisiones') {
    comisionesMeses = values;
    comisionesHidden.value = total;
    comisionesTotalInput.value = total;
  } else if (modalMode === 'horas') {
    horasMeses = values;
    horasExtrasHidden.value = total;
    horasExtrasTotalInput.value = total;
  }

  closeModal();
}

fechaIngresoInput.addEventListener('change', updatePeriodoState);
fechaIngresoInput.addEventListener('change', updateRegistroState);
periodoInput.addEventListener('change', updateRegistroState);
asignacionCheck.addEventListener('change', toggleAsignacionFamiliar);
comisionesButton.addEventListener('click', () => openModal('comisiones'));
horasButton.addEventListener('click', () => openModal('horas'));
closeModalButton.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});
modalForm.addEventListener('submit', saveModalValues);

window.addEventListener('load', updateRegistroState);

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const fechaIngreso = fechaIngresoInput.value;
  const periodoSeleccionado = periodoInput.value;
  const sueldoBasico = Number(sueldoBasicoInput.value);
  const asignacionFamiliar = Number(asignacionInput.value);
  const inasistencias = Number(inasistenciasInput.value);
  const comisiones = Number(comisionesHidden.value);
  const horasExtras = Number(horasExtrasHidden.value);
  const gratificacion = Number(gratificacionInput.value);
  // Obtener el factor del régimen seleccionado (General = 100%, MYPE = 50%)
  const activeToggleBtn = document.querySelector('#tabCts .toggle-group .toggle-btn.active');
  const factorRegimen = activeToggleBtn ? parseFloat(activeToggleBtn.getAttribute('data-value')) : 1.0;

  const mesesTrabajados = calcularMeses(fechaIngreso, periodoSeleccionado);
  const ctsBase = sueldoBasico+asignacionFamiliar+gratificacion /6 + horasExtras /6 + comisiones /6;
  
  let ctsCalculo= ctsBase*factorRegimen;
  let descuentoInasistencias=0;

  if (mesesTrabajados.meses < 6) {
    const mesesPagar=(ctsBase*factorRegimen)/12*mesesTrabajados.meses;
    const diasPagar=(ctsBase*factorRegimen)/360*mesesTrabajados.dias;
    ctsCalculo=mesesPagar+diasPagar;
  }


  let ctsPagar=ctsCalculo;
  const ctsInasistenciasCard = document.getElementById('ctsInasistenciasCard');
  if(inasistencias>0){
    descuentoInasistencias= ctsBase/360*inasistencias;
    ctsPagar-=descuentoInasistencias;
    if (ctsInasistenciasCard) ctsInasistenciasCard.style.display = 'grid';
  } else {
    if (ctsInasistenciasCard) ctsInasistenciasCard.style.display = 'none';
  }
  cancelarAnimaciones();

    descuentoInasistenciasLabel.textContent = '- ' + formatearMoneda(descuentoInasistencias);
    ctsLabel.textContent = formatearMoneda(ctsBase);
    ctsCalculoLabel.textContent = formatearMoneda(ctsCalculo);
    sueldoBasicoLabel.textContent = formatearMoneda(sueldoBasico);
    asignacionFamiliarLabel.textContent = formatearMoneda(asignacionFamiliar);
    gratificacionLabel.textContent = formatearMoneda(gratificacion / 6);
    horasExtrasLabel.textContent = formatearMoneda(horasExtras / 6);
    comisionesLabel.textContent = formatearMoneda(comisiones / 6);


  animarValor(
    ctsPagarLabel,
    parseNumero(ctsPagarLabel.textContent),
    ctsPagar,
    900,
    (valor) => formatearMoneda(valor)
  );

  resultadoCard.querySelector('.result-summary').textContent =
    'CTS estimada según sus datos. Ajusta los valores y registra los meses para actualizar el resultado.';
});


/* ═══════════════════════════════════════
   GRATIFICACIÓN CALCULATOR
   ═══════════════════════════════════════ */
const gratForm = document.getElementById('gratForm');
const gratFechaIngresoInput = document.getElementById('gratFechaIngreso');
const gratPeriodoInput = document.getElementById('gratPeriodo');
const gratSueldoBasicoInput = document.getElementById('gratSueldoBasico');
const gratAsignacionInput = document.getElementById('gratAsignacionFamiliar');
const gratDiasNoLaboradosInput = document.getElementById('gratDiasNoLaborados');
const gratAsignacionCheck = document.getElementById('gratAsignacionCheck');

// Result labels
const gratMesesComputablesLabel = document.getElementById('gratMesesComputablesLabel');
const gratDiasComputablesLabel = document.getElementById('gratDiasComputablesLabel');
const gratSueldoBasicoLabel = document.getElementById('gratSueldoBasicoLabel');
const gratAsignacionFamiliarLabel = document.getElementById('gratAsignacionFamiliarLabel');
const gratHorasExtrasResultLabel = document.getElementById('gratHorasExtrasResultLabel');
const gratComisionesResultLabel = document.getElementById('gratComisionesResultLabel');
const gratRemuneracionLabel = document.getElementById('gratRemuneracionLabel');
const gratOrdinariaLabel = document.getElementById('gratOrdinariaLabel');
const gratBonificacionLabel = document.getElementById('gratBonificacionLabel');
const gratDescuentoDiasLabel = document.getElementById('gratDescuentoDiasLabel');
const gratTotalPagarLabel = document.getElementById('gratTotalPagarLabel');
const gratResultadoCard = document.getElementById('gratResultadoCard');

// Modal elements for Gratificación
const gratModal = document.getElementById('gratRegistroModal');
const gratCloseModalBtn = document.getElementById('gratCloseModal');
const gratModalForm = document.getElementById('gratModalForm');
const gratModalFieldsEl = document.getElementById('gratModalFields');
const gratModalTitleEl = document.getElementById('gratModalTitle');
const gratModalTypeLabelEl = document.getElementById('gratModalTypeLabel');
const gratModalTotalEl = document.getElementById('gratModalTotal');
const gratComisionesTotalInput = document.getElementById('gratComisionesTotal');
const gratHorasExtrasTotalInput = document.getElementById('gratHorasExtrasTotal');
const gratComisionesHidden = document.getElementById('gratComisionesHidden');
const gratHorasExtrasHidden = document.getElementById('gratHorasExtrasHidden');
const gratOpenHorasBtn = document.getElementById('gratOpenHorasModal');
const gratOpenComisionesBtn = document.getElementById('gratOpenComisionesModal');

let gratCurrentMonths = 0;
let gratModalMode = null;
let gratComisionesMeses = [0, 0, 0, 0, 0, 0];
let gratHorasMeses = [0, 0, 0, 0, 0, 0];
let gratFechasPeriodos = [];
let gratMesInicio = 0;

gratFechaIngresoInput.max = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

function gratCalcMeses(fechaIngreso, periodoSeleccionado) {
  if (!fechaIngreso || !periodoSeleccionado) {
    return { meses: 0, dias: 0 };
  }

  const ingreso = new Date(fechaIngreso);
  if (Number.isNaN(ingreso.getTime())) {
    return { meses: 0, dias: 0 };
  }

  const periodo = gratFechasPeriodos.find(p => p.fin === periodoSeleccionado);
  if (!periodo) return { meses: 0, dias: 0 };

  const inicioPeriodo = new Date(periodo.inicio);
  const finPeriodo = new Date(periodo.fin);

  if (ingreso > finPeriodo) {
    return { meses: 0, dias: 0 };
  }

  const inicio = ingreso > inicioPeriodo ? ingreso : inicioPeriodo;
  gratMesInicio = inicio.getUTCMonth();

  // Count complete calendar months
  let mesesCompletos = 0;
  let diasParcial = 0;

  // If the worker started after day 1 of the month, that month is not complete
  const mesInicioNum = inicio.getUTCMonth();
  const anioInicio = inicio.getUTCFullYear();
  const mesFinNum = finPeriodo.getMonth();
  const anioFin = finPeriodo.getFullYear();

  // Calculate total months between start and end
  const totalMeses = (anioFin - anioInicio) * 12 + (mesFinNum - mesInicioNum) + 1;

  if (inicio.getUTCDate() > 1) {
    // First month is incomplete
    mesesCompletos = totalMeses - 1;
    const ultimoDia = new Date(anioInicio, mesInicioNum + 1, 0).getUTCDate();
    diasParcial = ultimoDia - inicio.getUTCDate() + 1;
  } else {
    mesesCompletos = totalMeses;
    diasParcial = 0;
  }

  return { meses: mesesCompletos, dias: diasParcial };
}

function gratUpdatePeriodo() {
  gratPeriodoInput.innerHTML = '';
  gratFechasPeriodos = [];
  const ingreso = new Date(gratFechaIngresoInput.value);
  if (Number.isNaN(ingreso.getTime())) return;

  const anioIngreso = ingreso.getUTCFullYear();
  const anioHoy = hoy.getFullYear();
  const mesIngreso = ingreso.getUTCMonth();
  const mesHoy = hoy.getMonth();

  if (ingreso > hoy) {
    alert('La fecha de ingreso no puede ser mayor a la fecha actual.');
    return;
  }

  // Gratificación periods: Jan-Jun (paid July) and Jul-Dec (paid December)
  for (let i = anioIngreso; i <= anioHoy; i++) {
    // Julio period (Ene-Jun)
    if (!(i === anioIngreso && mesIngreso > 5)) {
      // Don't add if we haven't reached at least January of this year
      if (!(i === anioHoy && mesHoy < 0)) {
        const opt1 = document.createElement('option');
        opt1.value = `${i}/06/30`;
        opt1.textContent = `Julio ${i} (Ene - Jun ${i})`;
        gratPeriodoInput.appendChild(opt1);
        gratFechasPeriodos.push({ inicio: `${i}/01/01`, fin: `${i}/06/30` });
      }
    }

    // Diciembre period (Jul-Dic)
    if (!(i === anioIngreso && mesIngreso > 11)) {
      if (!(i === anioHoy && mesHoy < 6)) {
        const opt2 = document.createElement('option');
        opt2.value = `${i}/12/31`;
        opt2.textContent = `Diciembre ${i} (Jul - Dic ${i})`;
        gratPeriodoInput.appendChild(opt2);
        gratFechasPeriodos.push({ inicio: `${i}/07/01`, fin: `${i}/12/31` });
      }
    }
  }

  gratPeriodoInput.selectedIndex = gratPeriodoInput.options.length - 1;
}

function gratUpdateRegistroState() {
  if (!gratPeriodoInput.value) return;
  const result = gratCalcMeses(gratFechaIngresoInput.value, gratPeriodoInput.value);
  gratCurrentMonths = result.dias > 0 ? result.meses + 1 : result.meses;

  animarValor(
    gratMesesComputablesLabel,
    parseNumero(gratMesesComputablesLabel.textContent),
    result.meses,
    700,
    (v) => `${Math.round(v)} meses`
  );
  animarValor(
    gratDiasComputablesLabel,
    parseNumero(gratDiasComputablesLabel.textContent),
    result.dias,
    300,
    (v) => `${Math.round(v)} días`
  );
}

function gratToggleAsignacion() {
  gratAsignacionInput.value = gratAsignacionCheck.checked ? 113 : 0;
}

// Modal for gratificación
function gratBuildModalFields(mode) {
  const values = mode === 'comisiones' ? gratComisionesMeses : gratHorasMeses;
  gratModalFieldsEl.innerHTML = '';

  const n = gratCurrentMonths;
  for (let i = 0; i < n; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'modal-field';

    let mesNumber = i + gratMesInicio + 1 > 12 ? i + gratMesInicio - 12 : i + gratMesInicio;
    const label = document.createElement('span');
    label.textContent = meses[mesNumber];

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.step = '1';
    input.value = values[i];
    input.addEventListener('input', gratCalcModalTotal);

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    gratModalFieldsEl.appendChild(wrapper);
  }
}

function gratCalcModalTotal() {
  const total = Array.from(gratModalFieldsEl.querySelectorAll('input')).reduce((s, inp) => s + Number(inp.value || 0), 0);
  gratModalTotalEl.textContent = total;
  return total;
}

function gratOpenModal(mode) {
  if (!gratFechaIngresoInput.value) {
    alert('Debes ingresar la fecha de ingreso.');
    return;
  }
  if (gratCurrentMonths < 3) {
    alert('Debes tener al menos 3 meses en el semestre.');
    return;
  }
  gratModalMode = mode;
  gratModal.classList.remove('hidden');
  gratModalTypeLabelEl.textContent = mode === 'comisiones' ? 'Comisiones' : 'Horas extras';
  gratModalTitleEl.textContent = mode === 'comisiones' ? 'Registrar comisiones mes a mes' : 'Registrar horas extras mes a mes';
  gratBuildModalFields(mode);
  gratCalcModalTotal();
}

function gratCloseModal() {
  gratModal.classList.add('hidden');
}

function gratSaveModal(event) {
  event.preventDefault();
  const inputs = Array.from(gratModalFieldsEl.querySelectorAll('input'));
  const values = inputs.map(inp => Number(inp.value || 0));
  const validValues = values.filter(v => v !== 0).length >= 3;
  let total = 0;

   if (validValues){
    total = values.reduce((s, v) => s + v, 0);
   }else{
    alert('Debes ingresar valores en al menos 3 meses para que se considere en el cálculo. Se ha registrado un total de 0 para este concepto.');
  }

  if (gratModalMode === 'comisiones') {
    gratComisionesMeses = values;
    gratComisionesHidden.value = total;
    gratComisionesTotalInput.value = total;
  } else {
    gratHorasMeses = values;
    gratHorasExtrasHidden.value = total;
    gratHorasExtrasTotalInput.value = total;
  }
  gratCloseModal();
}

// Event listeners for Gratificación
gratFechaIngresoInput.addEventListener('change', gratUpdatePeriodo);
gratFechaIngresoInput.addEventListener('change', gratUpdateRegistroState);
gratPeriodoInput.addEventListener('change', gratUpdateRegistroState);
gratAsignacionCheck.addEventListener('change', gratToggleAsignacion);
gratOpenHorasBtn.addEventListener('click', () => gratOpenModal('horas'));
gratOpenComisionesBtn.addEventListener('click', () => gratOpenModal('comisiones'));
gratCloseModalBtn.addEventListener('click', gratCloseModal);
gratModal.addEventListener('click', (e) => { if (e.target === gratModal) gratCloseModal(); });
gratModalForm.addEventListener('submit', gratSaveModal);

// Gratificación calculation
gratForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const fechaIngreso = gratFechaIngresoInput.value;
  const periodoSel = gratPeriodoInput.value;
  const sueldoBasico = Number(gratSueldoBasicoInput.value);
  const asignacionFamiliar = Number(gratAsignacionInput.value);
  const diasNoLaborados = Number(gratDiasNoLaboradosInput.value);
  const comisiones = Number(gratComisionesHidden.value);
  const horasExtras = Number(gratHorasExtrasHidden.value);

  const mesesTrabajados = gratCalcMeses(fechaIngreso, periodoSel);

  // Promedio de variables (only if received >= 3 times in semester)
  const promedioHorasExtras = horasExtras / 6;
  const promedioComisiones = comisiones / 6;

  // Remuneración computable
  const remuneracionComputable = sueldoBasico + asignacionFamiliar + promedioHorasExtras + promedioComisiones;

  // Obtener el factor del régimen seleccionado (General = 100%, MYPE = 50%)
  const activeToggleBtn = document.querySelector('#tabGratificacion .toggle-group .toggle-btn.active');
  const factorRegimen = activeToggleBtn ? parseFloat(activeToggleBtn.getAttribute('data-value')) : 1.0;
  debugger;
  // Gratificación: proportional based on complete months and regimen factor
  let gratificacionOrdinaria;
  if (mesesTrabajados.meses >= 6) {
    gratificacionOrdinaria = remuneracionComputable * factorRegimen;
  } else {
    gratificacionOrdinaria = ((remuneracionComputable * factorRegimen) / 6) * mesesTrabajados.meses;
  }

  // Bonificación extraordinaria (9% for EsSalud)
  const bonificacion = gratificacionOrdinaria * 0.09;

  // Deduction for unexcused absences
  let descuentoDias = 0;
  const gratInasistenciasCard = document.getElementById('gratInasistenciasCard');
  if (diasNoLaborados > 0) {
    descuentoDias = (((remuneracionComputable * factorRegimen) / 6) / 30) * diasNoLaborados;
    if (gratInasistenciasCard) gratInasistenciasCard.style.display = 'flex';
  }else{
    if (gratInasistenciasCard) gratInasistenciasCard.style.display = 'none';
  }

  // Total
  const totalGrat = gratificacionOrdinaria + bonificacion - descuentoDias;

  cancelarAnimaciones();

  // Update result labels
  gratSueldoBasicoLabel.textContent = formatearMoneda(sueldoBasico);
  gratAsignacionFamiliarLabel.textContent = formatearMoneda(asignacionFamiliar);
  gratHorasExtrasResultLabel.textContent = formatearMoneda(promedioHorasExtras);
  gratComisionesResultLabel.textContent = formatearMoneda(promedioComisiones);
  gratRemuneracionLabel.textContent = formatearMoneda(remuneracionComputable);
  gratOrdinariaLabel.textContent = formatearMoneda(gratificacionOrdinaria);
  gratBonificacionLabel.textContent = formatearMoneda(bonificacion);
  gratDescuentoDiasLabel.textContent = formatearMoneda(descuentoDias);

  animarValor(
    gratTotalPagarLabel,
    parseNumero(gratTotalPagarLabel.textContent),
    totalGrat,
    900,
    (v) => formatearMoneda(v)
  );

  gratResultadoCard.querySelector('.result-summary').textContent =
    'Gratificación estimada según sus datos. Ajuste los valores para actualizar el resultado.';
});

// Regimen toggle buttons functionality
const toggleBtns = document.querySelectorAll('.toggle-group .toggle-btn');
toggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const parent = btn.closest('.toggle-group');
    if (parent) {
      parent.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    }
    btn.classList.add('active');
  });
});

