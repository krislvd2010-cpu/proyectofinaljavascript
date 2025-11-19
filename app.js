let saldo = 0;
let dniIngresado = "";

// ----------------------
// Cambiar pantallas
// ----------------------
function mostrarPantalla(id) {
    document.querySelectorAll(".pantalla").forEach(p => p.classList.add("oculto"));
    document.getElementById(id).classList.remove("oculto");
    document.getElementById(id).classList.add("visible");

    if (id === "pantalla-login") limpiarCampos();

    if (id === "pantalla-consultar") {
        document.getElementById("txt-saldo").innerText = "S/ " + saldo.toFixed(2);
    }
}

// ----------------------
function limpiarCampos() {
    document.querySelectorAll("input").forEach(i => i.value = "");
}

// ----------------------
// Solo números
// ----------------------
function soloNumeros(input) {
    input.value = input.value.replace(/\D/g, "");
}

// ----------------------
// Validar DNI
// ----------------------
function validarLogin() {
    const dniInput = document.getElementById("dni");
    let dni = dniInput.value;

    if (dni.length !== 8) {
        alert("El DNI debe tener 8 dígitos.");
        // limpia el campo automaticamente
        dniInput.value="";

        //evita que quede un caracter invisible 
        setTimeout(()=>dniInput.focus(),10);
        return;
    }

    dniIngresado = dni;
    mostrarPantalla("pantalla-pin");
}

// ----------------------
// Validar clave secreta
// ----------------------
function validarClave() {
    let clave = document.getElementById("clave").value;

    if (clave.length !== 4) {
        alert("La clave debe tener 4 dígitos.");
        return;
    }

    document.getElementById("bienvenida").innerText =
        "Bienvenido usuario " + dniIngresado;

    mostrarPantalla("pantalla-bienvenida");
}

// ----------------------
// Ingresar monto
// ----------------------
function ingresarMontoPantalla() {
    let monto = parseFloat(document.getElementById("monto-ingresar").value);

    if (isNaN(monto) || monto <= 0) {
        alert("Ingrese un monto válido.");
        return;
    }

    saldo += monto;
    alert("Depósito exitoso.");
    mostrarPantalla("pantalla-menu");
}

// ----------------------
// Retirar monto
// ----------------------
function retirarMontoPantalla() {
    let monto = parseFloat(document.getElementById("monto-retirar").value);

    if (isNaN(monto) || monto <= 0) {
        alert("Monto inválido.");
        return;
    }

    if (monto > saldo) {
        alert("No tienes suficiente saldo.");
        return;
    }

    saldo -= monto;
    alert("Retiro exitoso.");
    mostrarPantalla("pantalla-menu");
}