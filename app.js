/* app.js - Cajero kiosk (revisado e integrado) */

/* Variables globales iniciales */
let audioBeep = null;

/* Mostrar / ocultar pantallas */
function mostrarPantalla(id) {
    document.querySelectorAll('.pantalla').forEach(el => {
        el.classList.add('oculto');
        el.classList.remove('visible');
    });
    const target = document.getElementById(id);
    if (!target) return;
    target.classList.remove('oculto');
    target.classList.add('visible');
}

/* Reproducir sonido en botones */
function playBeep() {
    if (!audioBeep) return;
    try {
        audioBeep.currentTime = 0;
        audioBeep.play();
    } catch (e) {
        // silencio si el navegador bloquea
    }
}

/* Función llamada al presionar el botón Ingresar */
function irALogin() {
    playBeep();
    mostrarPantalla('pantalla-login-dni');
}

/* -------------------- Usuarios iniciales -------------------- */
const usuariosDefault = [
    { nombre: "Mali", saldo: 200.00, password: "1234", dni: "44788834", movimientos: [] },
    { nombre: "Gera", saldo: 150.00, password: "5678", dni: "10247439", movimientos: [] },
    { nombre: "Sabi", saldo: 60.00,  password: "9102", dni: "98005362", movimientos: [] }
];

let usuarios = [];
let usuarioActivoIndex = null; // índice en usuarios[]
let autentificadoTemporal = false; // no usado extensivamente

// ---------- LocalStorage: cargar / guardar ----------
function cargarUsuarios() {
    const raw = localStorage.getItem('cajero_usuarios_v1');
    if (!raw) {
        usuarios = usersClone(usuariosDefault);
        guardarUsuarios();
    } else {
        try {
            usuarios = JSON.parse(raw);
            if (!Array.isArray(usuarios) || usuarios.length === 0) usuarios = usersClone(usuariosDefault);
        } catch (e) {
            usuarios = usersClone(usuariosDefault);
        }
    }
}

function guardarUsuarios() {
    localStorage.setItem('cajero_usuarios_v1', JSON.stringify(usuarios));
}

function usersClone(arr) {
    return arr.map(u => ({ nombre: u.nombre, saldo: Number(u.saldo), password: u.password, dni: u.dni, movimientos: u.movimientos || [] }));
}

// ---------- Utilitarios ----------
function soloNumeros(input) {
    input.value = input.value.replace(/\D/g, '');
}

function clearField(id) {
    const el = document.getElementById(id);
    if (el) el.value = '';
    playBeep();
}

function volverA(id) {
    mostrarPantalla(id);
    playBeep();
}

// ---------- Inicio: login por DNI ----------
function loginPorDni() {
    playBeep();
    const dni = (document.getElementById('login-dni').value || '').trim();
    const msg = document.getElementById('login-dni-msg');
    msg.className = 'mensaje';
    msg.innerText = '';

    if (!dni) {
        msg.className = 'mensaje error';
        msg.innerText = 'Ingrese su DNI.';
        return;
    }
    if (dni.length !== 8) {
        msg.className = 'mensaje error';
        msg.innerText = 'DNI debe tener 8 dígitos.';
        return;
    }
    const idx = usuarios.findIndex(u => u.dni === dni);
    if (idx === -1) {
        msg.className = 'mensaje error';
        msg.innerText = 'DNI no registrado.';
        return;
    }
    // guardar índice temporal en atributo de pantalla
    document.getElementById('pantalla-login-clave').dataset.dniIndex = idx;
    mostrarPantalla('pantalla-login-clave');
}

// ---------- validar login final ----------
function validarLoginDNI() {
    playBeep();
    const clave = (document.getElementById('login-clave').value || '').trim();
    const idx = parseInt(document.getElementById('pantalla-login-clave').dataset.dniIndex);
    const msg = document.getElementById('login-clave-msg');
    msg.className = 'mensaje';
    msg.innerText = '';

    if (Number.isNaN(idx) || !usuarios[idx]) {
        msg.className = 'mensaje error';
        msg.innerText = 'Error interno: usuario no encontrado.';
        return;
    }
    if (!clave) {
        msg.className = 'mensaje error';
        msg.innerText = 'Ingrese la contraseña.';
        return;
    }
    if (clave !== usuarios[idx].password) {
        msg.className = 'mensaje error';
        msg.innerText = 'Contraseña incorrecta.';
        return;
    }

    // login correcto
    usuarioActivoIndex = idx;
    actualizarInfoUsuario();
    msg.className = 'mensaje success';
    msg.innerText = 'Acceso correcto. Bienvenido ' + usuarios[idx].nombre + '.';
    // limpiar inputs
    document.getElementById('login-dni').value = '';
    document.getElementById('login-clave').value = '';

    // ir al menú (pequeña espera para que el usuario vea el mensaje)
    setTimeout(() => {
        mostrarPantalla('pantalla-menu');
        document.getElementById('login-clave-msg').innerText = '';
    }, 600);
}

// ---------- cerrar sesión ----------
function cerrarSesion() {
    playBeep();
    usuarioActivoIndex = null;
    actualizarInfoUsuario();
    mostrarPantalla('pantalla-login-dni');
}

// ---------- actualizar info usuario ----------
function actualizarInfoUsuario() {
    const el = document.getElementById('usuario-activo');
    if (!el) return;
    if (usuarioActivoIndex === null) {
        el.innerText = '';
    } else {
        const u = usuarios[usuarioActivoIndex];
        el.innerText = `${u.nombre}`;
    }
}

// ---------- abrir operación protegida (pide contraseña) ----------
function abrirOperacionProtegida(op) {
    playBeep();
    if (usuarioActivoIndex === null) {
        const m = document.getElementById('menu-msg');
        if (m) { m.className = 'mensaje error'; m.innerText = 'No hay usuario activo. Inicie sesión primero.'; }
        return;
    }
    // limpiar mensajes previos
    ['consultar-msg','movs-msg','ing-pass-msg','ret-pass-msg','menu-msg','ing-res','ret-res'].forEach(id => {
        const e = document.getElementById(id); if (e) { e.innerText=''; e.className='mensaje'; }
    });

    if (op === 'consultar') {
        mostrarPantalla('pantalla-consultar');
        const panel = document.getElementById('consultar-panel-pass');
        if (panel) panel.classList.remove('oculto');
        const result = document.getElementById('consultar-result');
        if (result) result.classList.add('oculto');
    } else if (op === 'movimientos') {
        mostrarPantalla('pantalla-movimientos');
        const panel = document.getElementById('movs-panel-pass');
        if (panel) panel.classList.remove('oculto');
        const result = document.getElementById('movs-result');
        if (result) result.classList.add('oculto');
    } else if (op === 'ingresar') {
        mostrarPantalla('pantalla-ingresar');
        const panel = document.getElementById('ing-panel-pass');
        if (panel) panel.classList.remove('oculto');
        const opanel = document.getElementById('ing-panel-op');
        if (opanel) opanel.classList.add('oculto');
        const res = document.getElementById('ing-res'); if (res) res.innerText = '';
        const input = document.getElementById('ing-monto'); if (input) input.value = '';
    } else if (op === 'retirar') {
        mostrarPantalla('pantalla-retirar');
        const panel = document.getElementById('ret-panel-pass');
        if (panel) panel.classList.remove('oculto');
        const opanel = document.getElementById('ret-panel-op');
        if (opanel) opanel.classList.add('oculto');
        const res = document.getElementById('ret-res'); if (res) res.innerText = '';
        const input = document.getElementById('ret-monto'); if (input) input.value = '';
    }
}

// ---------- validarOperacion ----------
function validarOperacion(tipo) {
    playBeep();
    let passInput, msgEl;
    if (tipo === 'consultar') { passInput = document.getElementById('consultar-pass'); msgEl = document.getElementById('consultar-msg'); }
    if (tipo === 'movimientos'){ passInput = document.getElementById('movs-pass'); msgEl = document.getElementById('movs-msg'); }
    if (tipo === 'ingresar') { passInput = document.getElementById('ing-pass'); msgEl = document.getElementById('ing-pass-msg'); }
    if (tipo === 'retirar')  { passInput = document.getElementById('ret-pass'); msgEl = document.getElementById('ret-pass-msg'); }

    if (!msgEl) return;
    msgEl.className = 'mensaje'; msgEl.innerText = '';
    const pass = (passInput.value || '').trim();

    if (!pass) {
        msgEl.className = 'mensaje error';
        msgEl.innerText = 'Ingrese la contraseña.';
        return;
    }

    if (usuarioActivoIndex === null) {
        msgEl.className = 'mensaje error';
        msgEl.innerText = 'Usuario no activo.';
        return;
    }

    const usuario = usuarios[usuarioActivoIndex];
    if (pass !== usuario.password) {
        msgEl.className = 'mensaje error';
        msgEl.innerText = 'Contraseña incorrecta.';
        return;
    }

    // contraseña OK -> mostrar la sección correspondiente
    passInput.value = '';
    if (tipo === 'consultar') {
        const panel = document.getElementById('consultar-panel-pass');
        if (panel) panel.classList.add('oculto');
        const result = document.getElementById('consultar-result');
        if (result) result.classList.remove('oculto');
        const saldoEl = document.getElementById('consultar-saldo');
        if (saldoEl) saldoEl.innerText = 'S/ ' + usuario.saldo.toFixed(2);
        const info = document.getElementById('consultar-info'); if (info) { info.className='mensaje'; info.innerText='Consulta realizada correctamente.'; }
    }
    if (tipo === 'movimientos') {
        const panel = document.getElementById('movs-panel-pass');
        if (panel) panel.classList.add('oculto');
        const result = document.getElementById('movs-result');
        if (result) result.classList.remove('oculto');
        renderMovimientos(usuario.movimientos);
        const info = document.getElementById('movs-info'); if (info) { info.className='mensaje'; info.innerText='Movimientos cargados.'; }
    }
    if (tipo === 'ingresar') {
        const panel = document.getElementById('ing-panel-pass'); if (panel) panel.classList.add('oculto');
        const opanel = document.getElementById('ing-panel-op'); if (opanel) opanel.classList.remove('oculto');
        const antes = document.getElementById('ing-saldo-antes'); if (antes) antes.innerText = 'S/ ' + usuario.saldo.toFixed(2);
        const desp = document.getElementById('ing-saldo-desp'); if (desp) desp.innerText = 'S/ ' + usuario.saldo.toFixed(2);
    }
    if (tipo === 'retirar') {
        const panel = document.getElementById('ret-panel-pass'); if (panel) panel.classList.add('oculto');
        const opanel = document.getElementById('ret-panel-op'); if (opanel) opanel.classList.remove('oculto');
        const actual = document.getElementById('ret-saldo-actual'); if (actual) actual.innerText = 'S/ ' + usuario.saldo.toFixed(2);
        const resPanel = document.getElementById('ret-panel-result'); if (resPanel) resPanel.classList.add('oculto');
    }
}

// ---------- render movimientos (6 últimos, 2 columnas y mensaje final) ----------
function renderMovimientos(list) {
    const ul = document.getElementById('movimientos-list');
    if (!ul) return;

    ul.innerHTML = '';

    if (!list || list.length === 0) {
        const li = document.createElement('li');
        li.innerText = 'No hay movimientos.';
        ul.appendChild(li);
        return;
    }

    // Tomar solo los 6 últimos (ordenados del más reciente)
    const ultimos10 = [...list].slice(-6).reverse();

    ultimos10.forEach(m => {
        const li = document.createElement('li');
        li.classList.add('mov-row');  // clase CSS para columnas

        const left = document.createElement('div');
        left.classList.add('mov-col');
        left.innerText = `${m.tipo === 'ingreso' ? 'Ingreso' : 'Retiro'} • ${new Date(m.fecha).toLocaleString()}`;

        const right = document.createElement('div');
        right.classList.add('mov-col');
        right.innerText = `S/ ${m.monto.toFixed(2)} (Saldo: S/ ${m.saldoPost.toFixed(2)})`;

        li.appendChild(left);
        li.appendChild(right);
        ul.appendChild(li);
    });

    // Si hay más de 6 → mensaje final
    if (list.length > 6) {
        const extra = document.createElement('li');
        extra.classList.add('mensaje', 'info');
        extra.style.marginTop = "10px";
        extra.innerText = "Para ver más movimientos ingrese a su app BCP";
        ul.appendChild(extra);
    }
}

// ---------- validarBilletesValidos ----------
function validarBilletesValidos(monto) {
    if (!Number.isFinite(monto)) return false;
    const billetes = [20, 50, 100, 200];
    for (let b of billetes) {
        if (monto % b === 0) return true;
    }
    return false;
}

// ---------- mostrar mensaje utilitario ----------
function mostrarMensajeElemento(id, texto, tipo) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'mensaje';
    if (tipo === 'error') el.className = 'mensaje error';
    if (tipo === 'success') el.className = 'mensaje success';
    el.innerText = texto;
}

// ---------- confirmar ingreso ----------
function confirmarIngreso() {
    playBeep();
    if (usuarioActivoIndex === null) return;
    const usuario = usuarios[usuarioActivoIndex];
    const input = document.getElementById('ing-monto');
    const res = document.getElementById('ing-res');
    if (!res || !input) return;

    res.className = 'mensaje'; res.innerText = '';

    const monto = Number((input.value || '').toString().replace(/\s/g, ''));
    if (isNaN(monto) || monto <= 0) {
        mostrarMensajeElemento('ing-res', 'Ingrese un monto válido mayor que 0.', 'error');
        return;
    }

    if (!validarBilletesValidos(monto)) {
        mostrarMensajeElemento('ing-res', 'Ingresar solo billetes válidos', 'error');
        return;
    }

    usuario.saldo = Number((usuario.saldo + monto).toFixed(2));
    const registro = { tipo: 'ingreso', monto: monto, fecha: new Date().toISOString(), saldoPost: usuario.saldo };
    usuario.movimientos.push(registro);
    guardarUsuarios();

    mostrarMensajeElemento('ing-res', `Depósito realizado: S/ ${monto.toFixed(2)}. Saldo actual: S/ ${usuario.saldo.toFixed(2)}.`, 'success');

    const antes = document.getElementById('ing-saldo-antes'); if (antes) antes.innerText = 'S/ ' + (usuario.saldo - monto).toFixed(2);
    const desp = document.getElementById('ing-saldo-desp'); if (desp) desp.innerText = 'S/ ' + usuario.saldo.toFixed(2);

    input.value = '';
    actualizarInfoUsuario();
}

// ---------- confirmar retiro ----------
function confirmarRetiro() {
    playBeep();
    if (usuarioActivoIndex === null) return;
    const usuario = usuarios[usuarioActivoIndex];
    const input = document.getElementById('ret-monto');
    const res = document.getElementById('ret-res');
    if (!res || !input) return;

    res.className = 'mensaje'; res.innerText = '';

    const monto = Number((input.value || '').toString().replace(/\s/g, ''));
    if (isNaN(monto) || monto <= 0) {
        mostrarMensajeElemento('ret-res', 'Ingrese un monto válido mayor que 0.', 'error');
        return;
    }

    if (!validarBilletesValidos(monto)) {
        mostrarMensajeElemento('ret-res', 'Ingresar solo billetes válidos', 'error');
        return;
    }

    if (monto > usuario.saldo) {
        mostrarMensajeElemento('ret-res', '⚠️ Saldo insuficiente. No se puede realizar el retiro.', 'error');
        return;
    }

    usuario.saldo = Number((usuario.saldo - monto).toFixed(2));
    const registro = { tipo: 'retiro', monto: monto, fecha: new Date().toISOString(), saldoPost: usuario.saldo };
    usuario.movimientos.push(registro);
    guardarUsuarios();

    mostrarMensajeElemento('ret-res', `Retiro efectuado: S/ ${monto.toFixed(2)}. Saldo actual: S/ ${usuario.saldo.toFixed(2)}.`, 'success');

    const showMonto = document.getElementById('ret-monto-show'); if (showMonto) showMonto.innerText = 'S/ ' + monto.toFixed(2);
    const showSaldo = document.getElementById('ret-saldo-show'); if (showSaldo) showSaldo.innerText = 'S/ ' + usuario.saldo.toFixed(2);
    const panelResult = document.getElementById('ret-panel-result'); if (panelResult) panelResult.classList.remove('oculto');

    input.value = '';
    actualizarInfoUsuario();
}

// ---------- cancelar operacion (volver al menu) ----------
function cancelarOperacion() {
    playBeep();
    mostrarPantalla('pantalla-menu');
}

// Asignar monto rápido
function setMontoRapido(valor, inputId, msgId) {
    playBeep();
    const input = document.getElementById(inputId);
    const msg = document.getElementById(msgId);
    if (!input) return;
    input.value = String(valor);
    if (msg) { msg.className = 'mensaje'; msg.innerText = ''; }
}

/* ---------------- Inicialización en DOMContentLoaded ---------------- */
document.addEventListener('DOMContentLoaded', () => {
    // referencias que dependen del DOM
    audioBeep = document.getElementById('audio-beep');

    // vincular botones que antes eran inline
    const btnIngresar = document.getElementById('btn-ingresar');
    if (btnIngresar) btnIngresar.addEventListener('click', irALogin);

    const btnLoginDni = document.getElementById('btn-login-dni');
    if (btnLoginDni) btnLoginDni.addEventListener('click', loginPorDni);

    const btnLoginClave = document.getElementById('btn-login-clave');
    if (btnLoginClave) btnLoginClave.addEventListener('click', validarLoginDNI);

    // reproducir beep en clicks de botones (UX)
    document.addEventListener('click', (e) => {
        const el = e.target;
        if (el.tagName === 'BUTTON') {
            playBeep();
        }
    });

    // cargar datos y mostrar bienvenida
    cargarUsuarios();
    mostrarPantalla('pantalla-bienvenida');
    actualizarInfoUsuario();
});

