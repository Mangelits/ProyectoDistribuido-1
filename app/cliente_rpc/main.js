// ======================================================================
// CLIENTE RPC
// ======================================================================
//? Este archivo es el cerebro de la aplicación del sanitario.
//? Se comunica con el servidor EXCLUSIVAMENTE mediante RPC (llamadas a
//? procedimientos remotos). No hay fetch ni XMLHttpRequest directo aquí,
//? todo pasa por la librería rpc.js que ya lo gestiona internamente.
//
//* FLUJO DE UNA LLAMADA RPC:
//*   1. El cliente llama a un procedimiento: loginRPC(user, pswd, callback)
//*   2. rpc.js convierte esa llamada en un POST a /RPC/gestion_sanitarios/loginSanitario
//*   3. El servidor ejecuta la función loginSanitario(user, pswd, callback)
//*   4. El servidor llama a callback(resultado)
//*   5. rpc.js recibe la respuesta y llama a tu callback con el resultado
// ======================================================================

// ======================================================================
// CONEXIÓN CON EL SERVIDOR RPC
// ======================================================================
var appRPC = rpc("localhost", "gestion_sanitarios");

var loginRPC           = appRPC.procedure("loginSanitario");
var crearSanitarioRPC  = appRPC.procedure("crearSanitario");
var actualizarSanRPC   = appRPC.procedure("actualizarSanitario");
var obtenerSanRPC      = appRPC.procedure("obtenerSanitario");
var obtenerCatsRPC     = appRPC.procedure("obtenerCategorias");
var obtenerModsRPC     = appRPC.procedure("obtenerModelos");
var obtenerRecursosRPC = appRPC.procedure("obtenerRecursos");
var obtenerRecursoRPC  = appRPC.procedure("obtenerRecurso");
var tiempoPendienteRPC = appRPC.procedure("tiempoPendiente");
var obtenerReservasRPC = appRPC.procedure("obtenerReservas");
var obtenerResenyasRPC = appRPC.procedure("obtenerResenyas");
var crearResenyaRPC    = appRPC.procedure("crearResenya");
var reservarRecursoRPC = appRPC.procedure("reservarRecurso");
var cancelarReservaRPC = appRPC.procedure("cancelarReserva");
var iniciarReservaRPC  = appRPC.procedure("iniciarReserva");
var finalizarReservaRPC = appRPC.procedure("finalizarReserva");

// ======================================================================
// VARIABLES GLOBALES DE SESIÓN
// ======================================================================
var idSanitarioLogueado = null;
var idRecursoResenya = null;

// Caché local para resolver nombres sin llamar al servidor cada vez
var categoriasLocal = [];
var modelosLocal    = [];
var ubicacionesLocal = [];

// ======================================================================
// LOGIN
// ======================================================================
function entrar() {
    var user = document.getElementById("login_user").value;
    var pswd = document.getElementById("login_password").value;

    // Llamada RPC asíncrona: envío user y pswd al servidor
    // El servidor busca el sanitario y devuelve su id (o null si no existe)
    // IMPORTANTE el código de debajo del loginRPC NO espera — se ejecuta
    // inmediatamente. La respuesta llega cuando el servidor la tiene (callback)
    loginRPC(user, pswd, function(idObtenido) {
        if (idObtenido != null) {
            idSanitarioLogueado = idObtenido;
            

            obtenerCatsRPC(function(cats) {
                categoriasLocal = cats;
                obtenerModsRPC(function(mods) {
                    modelosLocal = mods;
                    cambiarSeccion('menu-principal');
                    actualizarInicio();
                });
            });
        } else {
            alert("Usuario o contraseña incorrectos");
        }
    });
}
// Se llama al pulsar "Salir" — limpia la sesión y vuelve al login
function salir() {
    idSanitarioLogueado = null;
    document.getElementById("login_user").value = "";
    document.getElementById("login_password").value = "";
    cambiarSeccion('login');
}

// ======================================================================
// REGISTRO Y EDICIÓN DE DATOS DEL SANITARIO
// ======================================================================
function guardarDatosSanitario() {
    var datos = {
        nom:  document.getElementById("sanitario_nombre").value,
        ape:  document.getElementById("sanitario_apellidos").value,
        user: document.getElementById("sanitario_login").value,
        pswd: document.getElementById("sanitario_password").value
    };

    if (idSanitarioLogueado) {
        // Editar datos del sanitario logueado
        actualizarSanRPC(idSanitarioLogueado, datos, function(resultado) {
            if (resultado) {
                alert("Datos actualizados correctamente");
                actualizarInicio();
                cambiarSeccion('menu-principal');
            } else {
                alert("Error al actualizar. El usuario puede estar en uso.");
            }
        });
    } else {
        // Registro de nuevo sanitario
        crearSanitarioRPC(datos, function(nuevoId) {
            if (nuevoId) {
                alert("Registrado correctamente. Ya puedes iniciar sesión.");
                cambiarSeccion('login');
            } else {
                alert("Error al registrar. El usuario puede estar en uso.");
            }
        });
    }
}

function editarDatosSanitario() {
    // Cargamos los datos actuales del sanitario en el formulario
    obtenerSanRPC(idSanitarioLogueado, function(sanitario) {
        if (sanitario) {
            document.getElementById("sanitario_nombre").value   = sanitario.nom;
            document.getElementById("sanitario_apellidos").value = sanitario.ape;
            document.getElementById("sanitario_login").value    = sanitario.user;
            document.getElementById("sanitario_password").value = ""; // nunca mostramos la contraseña
            cambiarSeccion('datos-sanitario');
        }
    });
}

// ======================================================================
// MENÚ PRINCIPAL
// ======================================================================
function actualizarInicio() {
    // Mostramos el nombre del sanitario en la bienvenida
    obtenerSanRPC(idSanitarioLogueado, function(sanitario) {
        if (sanitario) {
            document.getElementById("mensaje_bienvenida").innerText =
                "Bienvenido " + sanitario.nom + " " + sanitario.ape + " ";
        }
    });

    // Cargamos todas las reservas del sanitario y las separamos en pendientes y realizadas
    obtenerReservasRPC(idSanitarioLogueado, function(reservas) {
        var pendientes = reservas.filter(r => r.fecha_inicio === null);
        var realizadas = reservas.filter(r => r.fecha_inicio !== null);

        cargarTablaPendientes(pendientes);
        cargarTablaRealizadas(realizadas);
    });
}

// ======================================================================
// TABLA RESERVAS PENDIENTES
// ======================================================================
function cargarTablaPendientes(pendientes) {
    var tbody = document.getElementById("lista_pendientes");
    tbody.innerHTML = "";

    if (pendientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No hay reservas pendientes</td></tr>';
        return;
    }

    pendientes.forEach(function(reserva) {
        obtenerRecursoRPC(reserva.recurso, function(recurso) {
            if (!recurso) return;

            // Resolvemos nombres desde la caché local
            var modeloObj   = modelosLocal.find(m => m.id === recurso.modelo);
            var nombreMod   = modeloObj ? modeloObj.nom : recurso.modelo;
            var catObj      = modeloObj ? categoriasLocal.find(c => c.id === modeloObj.categoria) : null;
            var nombreCat   = catObj ? catObj.nom : recurso.modelo;

            tiempoPendienteRPC(reserva.recurso, function(horas) {
                var horasTexto  = horas > 0 ? horas + "h" : "0";
                var botonRetirar = horas === 0
                    ? `<button onclick="retirarRecurso('${reserva.id}')">Retirar</button> `
                    : "";

                var fila = `<tr>
                    <td>${nombreCat}</td>
                    <td>${nombreMod}</td>
                    <td>${recurso.num_serie}</td>
                    <td>${recurso.ubi}</td>
                    <td>${formatearFecha(reserva.fecha_peticion)}</td>
                    <td>${horasTexto}</td>
                    <td>
                        ${botonRetirar}
                        <button onclick="cancelarReserva('${reserva.id}')">X</button>
                    </td>
                </tr>`;
                tbody.innerHTML += fila;
            });
        });
    });
}

// ======================================================================
// TABLA RESERVAS REALIZADAS
// ======================================================================
function cargarTablaRealizadas(realizadas) {
    var tbody = document.getElementById("lista_realizadas");
    tbody.innerHTML = "";

    if (realizadas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No hay reservas realizadas</td></tr>';
        return;
    }

    realizadas.forEach(function(reserva) {
        obtenerRecursoRPC(reserva.recurso, function(recurso) {
            if (!recurso) return;

            // Resolvemos nombres desde la caché local
            var modeloObj = modelosLocal.find(m => m.id === recurso.modelo);
            var nombreMod = modeloObj ? modeloObj.nom : recurso.modelo;
            var catObj    = modeloObj ? categoriasLocal.find(c => c.id === modeloObj.categoria) : null;
            var nombreCat = catObj ? catObj.nom : recurso.modelo;

            // F.Fin: muestra la fecha si existe, o el botón Devolver si no
            var celdaFin = reserva.fecha_fin
                ? formatearFecha(reserva.fecha_fin)
                : `<button onclick="devolverRecurso('${reserva.id}')">Devolver</button>`;

            var fila = `<tr>
                <td>${nombreCat}</td>
                <td>${nombreMod}</td>
                <td>${recurso.num_serie}</td>
                <td>${reserva.horas_estimadas}</td>
                <td>${formatearFecha(reserva.fecha_inicio)}</td>
                <td>${celdaFin}</td>
                <td><button onclick="abrirResenya('${reserva.recurso}', '${recurso.num_serie}')">Reseña</button></td>
            </tr>`;
            tbody.innerHTML += fila;
        });
    });
}

// ======================================================================
// ACCIONES SOBRE RESERVAS
// ======================================================================
function retirarRecurso(idReserva) {
    iniciarReservaRPC(idReserva, function(resultado) {
        if (resultado) {
            actualizarInicio();
        } else {
            alert("Error al retirar el recurso");
        }
    });
}

function devolverRecurso(idReserva) {
    finalizarReservaRPC(idReserva, function(resultado) {
        if (resultado) {
            actualizarInicio();
        } else {
            alert("Error al devolver el recurso");
        }
    });
}

function cancelarReserva(idReserva) {
    if (confirm("¿Seguro que quieres cancelar esta reserva?")) {
        cancelarReservaRPC(idReserva, function(resultado) {
            if (resultado) {
                actualizarInicio();
            } else {
                alert("Error al cancelar la reserva");
            }
        });
    }
}

// ======================================================================
// NUEVA RESERVA
// ======================================================================
function abrirNuevaReserva() {
    // Cargamos las categorías en el select
    obtenerCatsRPC(function(categorias) {
        var select = document.getElementById("filtro_categoria");
        select.innerHTML = "";
        categorias.forEach(function(cat) {
            select.innerHTML += `<option value="${cat.id}">${cat.nom}</option>`;
        });
        // Cargamos los modelos de la primera categoría
        cargarModelos();
    });

    document.getElementById("lista_busqueda").innerHTML = "";
    cambiarSeccion('nueva-reserva');
}

function cargarModelos() {
    var idCategoria = document.getElementById("filtro_categoria").value;

    obtenerModsRPC(function(modelos) {
        var select = document.getElementById("filtro_modelo");
        select.innerHTML = "";
        var modelosFiltrados = modelos.filter(m => m.categoria === idCategoria);
        modelosFiltrados.forEach(function(mod) {
            select.innerHTML += `<option value="${mod.id}">${mod.nom}</option>`;
        });
    });
}

function buscarRecursosSanitario() {
    var idModelo       = document.getElementById("filtro_modelo").value;
    var tiempoEstimado = parseInt(document.getElementById("tiempo_estimado").value);
    var tbody          = document.getElementById("lista_busqueda");
    tbody.innerHTML    = "";

    obtenerRecursosRPC(idModelo, function(recursos) {
        if (recursos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No hay recursos disponibles para ese modelo</td></tr>'; // Si no hay recursos, mostramos un mensaje y salimos
            return;
        }

        recursos.forEach(function(recurso) {
            // Para cada recurso calculamos su tiempo pendiente y su valoración media
            tiempoPendienteRPC(recurso.id, function(horas) {
                obtenerResenyasRPC(recurso.id, function(resenyas) {
                    // Valoración media
                    var valoracionMedia = "Sin reseñas";
                    if (resenyas.length > 0) {
                        var suma = resenyas.reduce((acc, r) => acc + r.valor, 0);
                        valoracionMedia = (suma / resenyas.length).toFixed(1);
                    }

                    // Disponibilidad y botón de acción
                    var disponibilidad, botonAccion;
                    if (horas === 0) {
                        disponibilidad = "Disponible";
                        botonAccion = `<button onclick="retirarDirecto('${recurso.id}', ${tiempoEstimado})">Retirar</button>`;
                    } else {
                        disponibilidad = horas + "h";
                        botonAccion = `<button onclick="hacerReserva('${recurso.id}', ${tiempoEstimado})">Reservar</button>`;
                    }

                    var fila = `<tr>
                        <td>${recurso.num_serie}</td>
                        <td>${recurso.ubi}</td>
                        <td>${disponibilidad}</td>
                        <td>${valoracionMedia}</td>
                        <td>${botonAccion}</td>
                    </tr>`;
                    tbody.innerHTML += fila;
                });
            });
        });
    });
}

function hacerReserva(idRecurso, horasEstimadas) {
    reservarRecursoRPC(idRecurso, idSanitarioLogueado, horasEstimadas, function(idReserva) {
        if (idReserva) {
            alert("Reserva realizada correctamente");
            cambiarSeccion('menu-principal');
            actualizarInicio();
        } else {
            alert("Error al realizar la reserva");
        }
    });
}

function retirarDirecto(idRecurso, horasEstimadas) {
    // Primero reservamos y luego iniciamos directamente
    reservarRecursoRPC(idRecurso, idSanitarioLogueado, horasEstimadas, function(idReserva) {
        if (idReserva) {
            iniciarReservaRPC(idReserva, function(resultado) {
                if (resultado) {
                    alert("Recurso retirado correctamente");
                    cambiarSeccion('menu-principal');
                    actualizarInicio();
                }
            });
        } else {
            alert("Error al retirar el recurso");
        }
    });
}

// ======================================================================
// RESEÑAS
// ======================================================================
function abrirResenya(idRecurso, numSerie) {
    idRecursoResenya = idRecurso;
    document.getElementById("resenya_recurso_serie").innerText = numSerie;
    document.getElementById("resenya_valor").value = "";
    document.getElementById("resenya_texto").value = "";
    cambiarSeccion('nueva-resenya');
}

function guardarResenya() {
    var valor       = parseInt(document.getElementById("resenya_valor").value);
    var descripcion = document.getElementById("resenya_texto").value;

    if (!valor || valor < 1 || valor > 5) {
        alert("La valoración debe ser un número entre 1 y 5");
        return;
    }

    crearResenyaRPC(idRecursoResenya, idSanitarioLogueado, valor, descripcion, function(idResenya) {
        if (idResenya) {
            alert("Reseña guardada correctamente");
            cambiarSeccion('menu-principal');
            actualizarInicio();
        } else {
            alert("Error al guardar la reseña");
        }
    });
}

// ======================================================================
// FECHA
// ======================================================================
function formatearFecha(fechaString) {
    if (!fechaString) return "";
    var d = new Date(fechaString);
    var dia = String(d.getDate()).padStart(2, '0');
    var mes = String(d.getMonth() + 1).padStart(2, '0');
    var anio = String(d.getFullYear()).substring(2, 4);
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    var ss = String(d.getSeconds()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hh}:${mm}:${ss}`;
}