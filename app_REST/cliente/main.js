var idGestorLogueado = null; // Variable para guardarme luego el ID del gestor que ha iniciado sesión

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
    idGestorLogueado = null; //? Me limpio la variable del ID del gestor logueado
    
    //? Limpio los campos de login y la tabla de recursos [para evitar que se vean datos del gestor anterior al volver a la pantalla de login]
    document.getElementById("login_user").value = "";
    document.getElementById("login_password").value = "";
    document.getElementById("tbody_recursos").innerHTML = "";
    
    cambiarSeccion("login");
}

function cargarDatosGestorEInicio() {
    rest.get("/api/gestores/" + idGestorLogueado, function(estado, respuesta) {
        if (estado === 200) {
            document.getElementById("mensaje_bienvenida").innerText = "Bienvenido " + respuesta.nom + " " + respuesta.ape + " ";
            cambiarSeccion("menu-principal");
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