var idGestorLogueado = null; // Variable para guardarme luego el ID del gestor que ha iniciado sesión
var nombreGestorLogueado = ''; // Para el origen en los avisos WS
var wsGestor = null;           // Conexión WebSocket

var categoriasLocal = [];
var modelosLocal = [];      //Inicializo unas variables locales, para evitar muchas llamadar al servidor
var ubicacionesLocal = [];

window.onload = function() { 
    cargarDatosBase();
};

function cargarDatosBase() {
    rest.get("/api/categorias", function (estado, respuesta) {
        if (estado === 200) categoriasLocal = respuesta;
        rest.get("/api/modelos", function (estado, respuesta) {
            if (estado === 200) modelosLocal = respuesta;
            rest.get("/api/ubicaciones", function (estado, respuesta) {
                if (estado === 200) ubicacionesLocal = respuesta;
                rellenarFiltrosYSelects();
            });
        });
    });
}

function rellenarFiltrosYSelects() { 
    var comboCatFiltro = document.getElementById("filtro_categoria");
    var comboModFiltro = document.getElementById("filtro_modelo");
    var comboUbiFiltro = document.getElementById("filtro_ubicacion");
    
    var comboCatRecurso = document.getElementById("recurso_categoria");
    var comboModRecurso = document.getElementById("recurso_modelo");
    var comboUbiRecurso = document.getElementById("recurso_ubicacion");

    // Limpiar (manteniendo 'Todos' en los filtros)
    comboCatFiltro.innerHTML = '<option value="Todos">Todos</option>';
    comboModFiltro.innerHTML = '<option value="Todos">Todos</option>';
    comboUbiFiltro.innerHTML = '<option value="Todos">Todos</option>';
    
    comboCatRecurso.innerHTML = '';
    comboModRecurso.innerHTML = '';
    comboUbiRecurso.innerHTML = '';

    // Llenar Categorías
    categoriasLocal.forEach(c => {
        comboCatFiltro.innerHTML += `<option value="${c.id}">${c.nom}</option>`;
        comboCatRecurso.innerHTML += `<option value="${c.id}">${c.nom}</option>`;
    });

    // Llenar Modelos
    modelosLocal.forEach(m => {
        comboModFiltro.innerHTML += `<option value="${m.id}">${m.nom}</option>`;
        comboModRecurso.innerHTML += `<option value="${m.id}">${m.nom}</option>`;
    });

    // Llenar Ubicaciones
    ubicacionesLocal.forEach(u => {
        comboUbiFiltro.innerHTML += `<option value="${u.id}">${u.nom}</option>`;
        comboUbiRecurso.innerHTML += `<option value="${u.id}">${u.nom}</option>`;
    });
}


// ==========================================
//! ----------------LOGIN--------------------
// ==========================================
function entrar() {
    var campoUser = document.getElementById("login_user").value;
    var campoPassword = document.getElementById("login_password").value;

    var credenciales = { 
        login: campoUser, 
        password: campoPassword 
    };

    rest.post("/api/gestores/login", credenciales, function(estado, respuesta) {
        if (estado === 200) {
            idGestorLogueado = respuesta; //? Me guardo el ID del gestor logueado
            cargarDatosGestorEInicio();
        } else {
            alert("Usuario o contraseña incorrectas");
        }
    });
}

function salir() {
    idGestorLogueado = null;
    
    // Cerrar WebSocket al salir (Parte 3)
    if (wsGestor) {
        wsGestor.close();
        wsGestor = null;
    }
    // Limpiar avisos
    document.getElementById('tbody_avisos').innerHTML = '<tr><td colspan="3"><em>Sin avisos recibidos aún</em></td></tr>';
    
    //? Limpio los campos de login y la tabla de recursos [para evitar que se vean datos del gestor anterior al volver a la pantalla de login]
    document.getElementById("login_user").value = "";
    document.getElementById("login_password").value = "";
    document.getElementById("tbody_recursos").innerHTML = "";
    
    cambiarSeccion("login");
}

function cargarDatosGestorEInicio() {
    rest.get("/api/gestores/" + idGestorLogueado, function(estado, respuesta) {
        if (estado === 200) {
            nombreGestorLogueado = respuesta.nom + " " + respuesta.ape;
            document.getElementById("mensaje_bienvenida").innerText = "Bienvenido " + nombreGestorLogueado + " ";
            
            // Abrir WebSocket al entrar (Parte 3)
            abrirWsGestor();
            
            cambiarSeccion("menu-principal");
        }
    });
}




// =========================================
//! FUNCION GET MINISTERIO | PRACTICA 3
// =========================================

// Nombres de las áreas médicas según los códigos del enunciado (id_area -> nombre)
var nombresAreas = {
    1: "Alergología",
    2: "Anestesiología",
    3: "Cardiología",
    4: "Cirugía General",
    5: "Dermatología",
    6: "Aparato Digestivo",
    7: "Endocrinología",
    8: "Ginecología",
    9: "Hematología",
    10: "Medicina Interna",
    11: "Neumología",
    12: "Neurología",
    13: "Oftalmología",
    14: "Oncología",
    15: "Pediatría",
    16: "Psiquiatría",
    17: "Traumatología",
    18: "Urología"
};

// Verifica un envío del Ministerio antes de contarlo en el ranking.
// Recibe el array "datos" de un envío (datosRank) y su id_area.
// Devuelve true solo si el área es válida (1-18) y TODOS los objetos del
// array tienen los campos con el tipo correcto.

function verificar(datosRank, id_area) {
    if (id_area < 1 || id_area > 18) {
        return false;
    }
    // datosRank tiene que ser un array (si no, no se puede recorrer)
    if (!Array.isArray(datosRank)) {
        return false;
    }
    // Formatos string y number
    for (var i = 0; i < datosRank.length; i++) {
        var valor = datosRank[i];
        // El objeto tiene que existir: con null o undefined, leer valor.nombre daría error.
        if (!valor) {
            return false;
        }
        // Todos los campos tienen que existir en el objeto (aunque fec_ini y fecha_fin valgan null).
        // "campo in valor" es true si el objeto tiene esa clave, tenga el valor que tenga.
        if (!('nombre' in valor) || !('apellidos' in valor) || !('categoría' in valor) ||
            !('horas_estimadas' in valor) || !('fec_pet' in valor) ||
            !('fec_ini' in valor) || !('fecha_fin' in valor)) {
            return false;
        }
        if (typeof valor.nombre !== 'string' || typeof valor.apellidos !== 'string' || typeof valor.categoría !== 'string' || typeof valor.horas_estimadas !== 'number') {
            return false;
        }
        // fec_pet es obligatoria: siempre hay fecha de petición.
        if (!esFechaValida(valor.fec_pet)) {
            return false;
        }
        // fec_ini y fecha_fin pueden ser null (reserva sin empezar o sin terminar).
        if ((valor.fec_ini !== null && !esFechaValida(valor.fec_ini)) ||
            (valor.fecha_fin !== null && !esFechaValida(valor.fecha_fin))) {
            return false;
        }
    }

    return true;
}

// Devuelve true si "fecha" es un texto en formato ISO 8601: YYYY-MM-DDTHH:MM:SS.sssZ
// (ejemplo: 2026-10-15T11:38:28.000Z).
// La expresión regular: inicio (^), 4 dígitos-2 dígitos-2 dígitos, la letra T,
// 2 dígitos:2 dígitos:2 dígitos, un punto (\.) con 3 dígitos de milisegundos,
// la letra Z (hora UTC) y fin ($).
// Un null o un número no pasan (no son texto).
function esFechaValida(fecha) {
    return typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(fecha);
}

function obtenerRankingReseñas() {
    rest.get("https://undefined.ua.es/telemedicina/api/datos", function (estado, respuesta) {
        if (estado === 200) {
            console.log("Datos obtenidos del Ministerio:", respuesta);

            // Contar, por cada id_area, cuántos objetos de "datos" pasan la verificación.
            // contadores queda así: { 12: 25, 3: 14, ... }
            // Si hay varios envíos de la misma área, se suman en el mismo contador.
            var contadores = {};

            respuesta.forEach(function (envio) {
                var idArea = envio.id_area;
                if ( 1 <= idArea && idArea <= 18 ) {
                    if (contadores[idArea] === undefined) contadores[idArea] = 0; // Inicializar contador si no existe aún
                }
                // Si datos no es un array no se puede recorrer: saltamos este envío.
                if (!Array.isArray(envio.datos)) {
                    return; // en un forEach, return pasa al siguiente envío
                }
                // Se verifica objeto a objeto: cada objeto válido suma 1 a su área.
                // A verificar se le pasa un array de un solo objeto ([objeto]).
                envio.datos.forEach(function (objeto) {
                    if (verificar([objeto], idArea)) {
                        contadores[idArea]++;
                    }
                });
            });

            // Pasar a un array [{ id_area, total }] y ordenarlo de mayor a menor (ranking).
            var ranking = [];
            for (var idArea in contadores) {
                ranking.push({ id_area: Number(idArea), total: contadores[idArea] });
            }
            ranking.sort(function (a, b) { return b.total - a.total; });

            
            var tbody = document.getElementById("tbody_ranking");
            tbody.innerHTML = ""; // limpiar el ranking anterior

            ranking.forEach(function (area, posicion) {
                var fila = document.createElement("tr");

                var celdaPos = document.createElement("td");
                celdaPos.textContent = posicion + 1;

                var celdaArea = document.createElement("td");
                celdaArea.textContent = nombresAreas[area.id_area] || ("Área " + area.id_area);

                var celdaTotal = document.createElement("td");
                celdaTotal.textContent = area.total;

                fila.appendChild(celdaPos);
                fila.appendChild(celdaArea);
                fila.appendChild(celdaTotal);
                tbody.appendChild(fila);
            });
        } else {
            alert("No se pudieron obtener los datos del Ministerio");
        }
    });
}


//* -----------------------------------------
//!  SERVICIO POST ENVIAR MINISTERIO (P3)
//* -----------------------------------------

var ID_AREA = 12; // Neurología: toda la app es de esta área

// Fecha de hoy en formato YYYY-MM-DD (fecha de la subida de los datos)
function fechaHoyYMD() {
    var d = new Date();
    var mes = String(d.getMonth() + 1).padStart(2, "0"); // getMonth() va de 0 a 11
    var dia = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + mes + "-" + dia;
}

// Devuelve el nombre de la categoría de un recurso: recurso -> modelo -> categoría
function nombreCategoriaRecurso(recurso) {
    var modelo = modelosLocal.find(m => m.id === recurso.modelo);
    if (!modelo) return "Desconocida";
    var categoria = categoriasLocal.find(c => c.id === modelo.categoria);
    return categoria ? categoria.nom : "Desconocida";
}

// Recoge TODAS las reservas usando los GET de nuestro servidor y las envía al Ministerio.
// Como cada GET es asíncrono, se usa un contador de peticiones pendientes:
// cuando llega a 0 es que ya han llegado todas las respuestas y se pasa al paso siguiente.
function enviarDatosMinisterio() {
    // 1) Todos los recursos (sin filtros)
    rest.get("/api/recursos", function (estado, recursos) {
        if (estado !== 200) {
            alert("No se pudieron obtener los recursos");
            return;
        }
        if (recursos.length === 0) {
            alert("No hay recursos, no hay reservas que enviar");
            return;
        }

        // 2) Las reservas de cada recurso
        var reservasConRecurso = []; // cada elemento: { reserva, recurso }
        var pendientes = recursos.length;
        var hayError = false;

        recursos.forEach(function (recurso) {
            rest.get("/api/recursos/" + recurso.id + "/reservas", function (estado, reservas) {
                if (estado === 200) {
                    reservas.forEach(function (reserva) {
                        reservasConRecurso.push({ reserva: reserva, recurso: recurso });
                    });
                } else {
                    hayError = true;
                }
                pendientes--;
                if (pendientes === 0) {
                    if (hayError) {
                        alert("No se pudieron obtener todas las reservas");
                        return;
                    }
                    obtenerSanitariosYEnviar(reservasConRecurso);
                }
            });
        });
    });
}

// 3) Pide los datos de cada sanitario (una sola vez por sanitario) y monta el envío
function obtenerSanitariosYEnviar(reservasConRecurso) {
    if (reservasConRecurso.length === 0) {
        alert("No hay reservas que enviar");
        return;
    }

    // Ids de sanitarios sin repetir
    var idsSanitarios = [];
    reservasConRecurso.forEach(function (rr) {
        if (!idsSanitarios.includes(rr.reserva.sanitario)) idsSanitarios.push(rr.reserva.sanitario);
    });

    var sanitarios = {}; // id -> { nom, ape }
    var pendientes = idsSanitarios.length;
    var hayError = false;

    idsSanitarios.forEach(function (idSanitario) {
        rest.get("/api/sanitarios/" + idSanitario, function (estado, sanitario) {
            if (estado === 200) {
                sanitarios[idSanitario] = sanitario;
            } else {
                hayError = true;
            }
            pendientes--;
            if (pendientes === 0) {
                if (hayError) {
                    alert("No se pudieron obtener todos los sanitarios");
                    return;
                }
                montarYEnviar(reservasConRecurso, sanitarios);
            }
        });
    });
}

// 4) Monta el body con el formato del Ministerio y 5) hace el POST
function montarYEnviar(reservasConRecurso, sanitarios) {
    var datos = reservasConRecurso.map(function (rr) {
        var sanitario = sanitarios[rr.reserva.sanitario];
        return {
            nombre: sanitario.nom,
            apellidos: sanitario.ape,
            "categoría": nombreCategoriaRecurso(rr.recurso),
            horas_estimadas: rr.reserva.horas_estimadas,
            // Las fechas ya llegan del servidor en ISO (2026-10-15T11:38:28.000Z) o null
            fec_pet: rr.reserva.fecha_peticion,
            fec_ini: rr.reserva.fecha_inicio,
            fecha_fin: rr.reserva.fecha_fin
        };
    });

    var envio = {
        id_area: ID_AREA,
        fecha: fechaHoyYMD(),
        datos: datos
    };
    console.log("Envío al Ministerio:", envio);

    rest.post("https://undefined.ua.es/telemedicina/api/datos", envio, function (estado, respuesta) {
        if (estado >= 200 && estado < 300) {
            alert("Datos enviados al Ministerio correctamente (" + datos.length + " reservas).");
        } else {
            alert("El Ministerio no aceptó el envío (código " + estado + ").");
            console.log("Respuesta del Ministerio:", respuesta);
        }
    });
}

function editarDatosGestor() {
    // Si entra aquí es porque ya hay un gestor logueado
    rest.get("/api/gestores/" + idGestorLogueado, function(estado, respuesta) {
        if (estado === 200) {
            document.getElementById("gestor_nombre").value = respuesta.nom;
            document.getElementById("gestor_apellidos").value = respuesta.ape;
            document.getElementById("gestor_login").value = respuesta.user;
            document.getElementById("gestor_password").value = ""; // No lo traemos por seguridad
            
            cambiarSeccion("datos-gestor");
        }
    });
}

function guardarDatosGestor() {
    var datos = {
        nombre: document.getElementById("gestor_nombre").value,
        apellidos: document.getElementById("gestor_apellidos").value,
        login: document.getElementById("gestor_login").value,
        password: document.getElementById("gestor_password").value
    };

    if (idGestorLogueado) {
        // ACTUALIZAR PERFIL EXISTENTE (PUT)
        rest.put("/api/gestores/" + idGestorLogueado, datos, function(estado, respuesta) {
            if (estado === 200) {
                alert("Datos actualizados correctamente");
                cargarDatosGestorEInicio();
            } else {
                alert("Error al actualizar: " + respuesta);
            }
        });
    } else {
        // REGISTRAR NUEVO (POST)
        rest.post("/api/gestores", datos, function(estado, respuesta) {
            if (estado === 201) {
                alert("Gestor registrado con éxito. Ya puedes iniciar sesión.");
                cambiarSeccion("login");
            } else {
                alert("Error: " + respuesta);
            }
        });
    }
}

function cancelarDatosGestor() {
    if (idGestorLogueado) {
        cambiarSeccion("menu-principal");
    } else {
        cambiarSeccion("login");
    }
}


// ==========================================
//! GESTIÓN DE RECURSOS (LISTA Y BUSCAR)
// ==========================================
function buscarRecursos() {
    var cat = document.getElementById("filtro_categoria").value; //? Capturo los valores de los filtros
    var mod = document.getElementById("filtro_modelo").value;
    var ubi = document.getElementById("filtro_ubicacion").value;
    var est = document.getElementById("filtro_estado").value;

    var query = `?categoria=${cat}&modelo=${mod}&ubicacion=${ubi}&estado=${est}`; //? Construyo la query string con los filtros (ej: ?categoria=2&modelo=5&ubicacion=Todos&estado=0)

    rest.get("/api/recursos" + query, function(estado, respuesta) { //? Hago la petición al servidor con la query string para que me filtre los recursos
        if (estado === 200) {
            var tbody = document.getElementById("tbody_recursos");
            tbody.innerHTML = "";

            respuesta.forEach(r => {
                // Obtener nombres a partir de los IDs
                var nombreCat = "Desconocida";
                var modeloObj = modelosLocal.find(m => m.id === r.modelo);
                if (modeloObj) {
                    var catObj = categoriasLocal.find(c => c.id === modeloObj.categoria);
                    if (catObj) nombreCat = catObj.nom;
                }
                
                var nombreMod = modeloObj ? modeloObj.nom : "Desconocido";
                var ubiObj = ubicacionesLocal.find(u => u.id === r.ubi);
                var nombreUbi = ubiObj ? ubiObj.nom : "Desconocida";
                
                var textosEstado = { "0": "Operativo", "1": "De baja o defectuoso", "2": "En mantenimiento" };
                var nombreEst = textosEstado[r.estado] || "Desconocido";

                var fila = `<tr>
                    <td>${r.num_serie}</td>
                    <td>${nombreCat}</td>
                    <td>${nombreMod}</td>
                    <td>${nombreUbi}</td>
                    <td>${nombreEst}</td>
                    <td>
                        <button onclick="abrirRecurso('${r.id}')">Abrir</button>
                        <button onclick="eliminarRecurso('${r.id}')">X</button>
                    </td>
                </tr>`;
                tbody.innerHTML += fila;
            });
        }
    });
}

function eliminarRecurso(id) {
    if(confirm("¿Seguro que deseas borrar este recurso?")) {
        rest.delete("/api/recursos/" + id, function(estado, respuesta) {
            if (estado === 200) {
                buscarRecursos(); // Refrescar tabla
            } else {
                alert("Error al borrar recurso");
            }
        });
    }
}

// ==========================================
//! FICHA DEL RECURSO (CREAR, EDITAR, RESERVAS, RESEÑAS)
// ==========================================
function nuevoRecurso() {
    document.getElementById("recurso_id_actual").value = "";
    document.getElementById("recurso_num_serie").value = "";
    document.getElementById("recurso_estado").value = "0";
    
    // Ocultar reservas y reseñas (no tiene aún)
    document.getElementById("seccion_reservas_resenyas").style.display = "none";
    
    cambiarSeccion("vista-recurso");
}

function abrirRecurso(id) {
    document.getElementById("recurso_id_actual").value = id;
    
    // 1. Obtener datos del recurso
    rest.get("/api/recursos/" + id, function(estado, respuesta) {
        if (estado === 200) {
            // Seleccionar categoría basada en el modelo
            var modeloObj = modelosLocal.find(m => m.id === respuesta.modelo);
            if(modeloObj) document.getElementById("recurso_categoria").value = modeloObj.categoria;
            
            document.getElementById("recurso_modelo").value = respuesta.modelo;
            document.getElementById("recurso_num_serie").value = respuesta.num_serie;
            document.getElementById("recurso_ubicacion").value = respuesta.ubi;
            document.getElementById("recurso_estado").value = respuesta.estado;
            
            document.getElementById("seccion_reservas_resenyas").style.display = "block";
            
            // 2. Cargar Reservas
            cargarReservasRecurso(id);
            // 3. Cargar Reseñas
            cargarResenyasRecurso(id);
            
            cambiarSeccion("vista-recurso");
        }
    });
}

function guardarRecurso() {
    var idActual = document.getElementById("recurso_id_actual").value; // Si tiene valor, es que estamos editando un recurso existente. Si está vacío, es que estamos creando uno nuevo.
    
    var datos = { //? Capturo los datos del formulario
        modelo: document.getElementById("recurso_modelo").value,
        num_serie: document.getElementById("recurso_num_serie").value,
        ubicacion: document.getElementById("recurso_ubicacion").value,
        estado: document.getElementById("recurso_estado").value
    };

    if (idActual) {
        // Actualizar (PUT)
        rest.put("/api/recursos/" + idActual, datos, function(estado, respuesta) {
            if (estado === 200) {
                alert("Recurso actualizado");
                cambiarSeccion("menu-principal");
                buscarRecursos();
            }
        });
    } else {
        // Crear nuevo (POST)
        rest.post("/api/recursos", datos, function(estado, respuesta) {
            if (estado === 201) {
                // Notificar via WS a todos los sanitarios (Parte 3)
                // == (no ===): datos.modelo es el value del <select> (texto) y
                // m.id viene de la BD como número. Comparación laxa para que cuadren.
                var modeloObj = modelosLocal.find(function(m) { return m.id == datos.modelo; });
                var nombreMod = modeloObj ? modeloObj.nom : datos.modelo;
                var catObj    = modeloObj ? categoriasLocal.find(function(c) { return c.id === modeloObj.categoria; }) : null;
                var nombreCat = catObj ? catObj.nom : datos.modelo;
                enviarAvisoWS({
                    action: 'notificar',
                    tipo: 'recurso',
                    origen: nombreGestorLogueado,
                    nombreCategoria: nombreCat,
                    nombreModelo: nombreMod,
                    numSerie: datos.num_serie
                });

                alert("Recurso creado");
                cambiarSeccion("menu-principal");
                buscarRecursos();
            }
        });
    }
}

// --- RESERVAS ---
function cargarReservasRecurso(idRecurso) {
    rest.get("/api/recursos/" + idRecurso + "/reservas", function(estado, respuesta) {
        if (estado === 200) {
            var tbody = document.getElementById("tbody_reservas");
            tbody.innerHTML = "";
            
            respuesta.forEach(reserva => {
                // Obtener nombre del sanitario de forma asíncrona para la tabla
                rest.get("/api/sanitarios/" + reserva.sanitario, function(stSanitario, resSanitario) {
                    var nombreSani = (stSanitario === 200) ? (resSanitario.nom + " " + resSanitario.ape) : "Desconocido";
                    
                    var colorClase = obtenerColorReserva(reserva);
                    
                    var fPet = formatearFecha(reserva.fecha_peticion);
                    var fIni = formatearFecha(reserva.fecha_inicio);
                    var fFin = formatearFecha(reserva.fecha_fin);

                    var fila = `<tr class="${colorClase}">
                        <td>${nombreSani}</td>
                        <td>${reserva.horas_estimadas}</td>
                        <td>${fPet}</td>
                        <td>${fIni}</td>
                        <td>${fFin}</td>
                    </tr>`;
                    
                    tbody.innerHTML += fila;
                });
            });
        }
    });
}

// COLORES DE RESERVA
function obtenerColorReserva(reserva) {
    if (reserva.fecha_fin) {
        return "reserva-finalizada"; // Blanco
    }
    if (!reserva.fecha_inicio) {
        return "reserva-pendiente"; //* Verde
    }
    
    // Si tiene inicio pero no tiene fin, comprobamos si se ha pasado de tiempo
    var fechaInicioObj = new Date(reserva.fecha_inicio);
    var horasMilisegundos = reserva.horas_estimadas * 60 * 60 * 1000;
    var fechaEstimadaFin = new Date(fechaInicioObj.getTime() + horasMilisegundos);
    var ahora = new Date(); //? Fecha actual
    
    if (ahora > fechaEstimadaFin) {
        return "reserva-en-uso-mal"; //! Rojo (superadas)
    } else {
        return "reserva-en-uso-ok"; //? Azul (no superadas)
    }
}

// --- RESEÑAS ---
function cargarResenyasRecurso(idRecurso) {
    rest.get("/api/recursos/" + idRecurso + "/resenyas", function(estado, respuesta) {
        if (estado === 200) {
            var tbody = document.getElementById("tbody_resenyas");
            tbody.innerHTML = "";
            
            respuesta.forEach(resenya => {
                rest.get("/api/sanitarios/" + resenya.sanitario, function(stSanitario, resSanitario) {
                    var nombreSani = (stSanitario === 200) ? (resSanitario.nom + " " + resSanitario.ape) : "Desconocido";
                    var fechaFormateada = formatearFecha(resenya.fecha);

                    var fila = `<tr>
                        <td>${fechaFormateada}</td>
                        <td>${nombreSani}</td>
                        <td>${resenya.valor}</td>
                        <td>${resenya.descripcion}</td>
                    </tr>`;
                    
                    tbody.innerHTML += fila;
                });
            });
        }
    });
}

// --- UTILIDADES ---
function formatearFecha(fechaString) { //? Convierte fecha ISO a formato PDF: dd/mm/aa hh:mm:ss
    if (!fechaString) return "";
    var d = new Date(fechaString);
    var dia = String(d.getDate()).padStart(2, '0');
    var mes = String(d.getMonth() + 1).padStart(2, '0');
    var anio = String(d.getFullYear()).substring(2, 4);
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    var ss = String(d.getSeconds()).padStart(2, '0');
    
    // Formato estilo PDF: 12/04/25 14:30:50
    return `${dia}/${mes}/${anio} <br> ${hh}:${mm}:${ss}`;
}

// =====================================================================
// WEBSOCKET - PARTE 3: Sistema de Avisos (Gestor)
// =====================================================================

// Abre la conexión WebSocket y registra al gestor
function abrirWsGestor() {
    if (wsGestor) { wsGestor.close(); }

    wsGestor = new WebSocket('ws://localhost:3502');

    wsGestor.onopen = function() {
        // Registro como gestor
        wsGestor.send(JSON.stringify({ action: 'register', tipo: 'gestor', id: idGestorLogueado }));
    };

    // Recibir avisos del servidor (solo reseñas para gestores)
    wsGestor.onmessage = function(evento) {
        var aviso = JSON.parse(evento.data);
        añadirAvisoTabla(aviso);
    };

    wsGestor.onerror = function() {
        console.warn('[WS] Error en la conexión WebSocket del gestor');
    };
}

// Envía un mensaje WS al servidor (p.ej. notificación de recurso creado)
function enviarAvisoWS(msg) {
    if (wsGestor && wsGestor.readyState === WebSocket.OPEN) {
        wsGestor.send(JSON.stringify(msg));
    }
}

// Añade una fila de aviso a la tabla de avisos
function añadirAvisoTabla(aviso) {
    var tbody = document.getElementById('tbody_avisos');
    // Eliminar placeholder si existe
    if (tbody.querySelector('em')) {
        tbody.innerHTML = '';
    }

    var claseColor = aviso.color === 'rojo' ? 'aviso-rojo' :
                     aviso.color === 'verde' ? 'aviso-verde' : 'aviso-azul';

    var fila = '<tr class="' + claseColor + '">' +
        '<td>' + aviso.fecha + '</td>' +
        '<td>' + aviso.origen + '</td>' +
        '<td>' + aviso.texto + '</td>' +
        '</tr>';

    tbody.innerHTML = fila + tbody.innerHTML; // más reciente arriba
}
