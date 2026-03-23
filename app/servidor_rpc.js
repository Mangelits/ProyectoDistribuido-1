//Es necesario instalar en la carpeta del servidor los modulos cors y express

var rpc = require("./rpc.js"); //incorporamos la libreria
var datos=require("./datos.js")


// ======================================================================
//? RPC (Remote Procedure Call) es un mecanismo de comunicación que permite
//? al cliente llamar a funciones que están definidas y se ejecutan en el servidor,
//? como si fueran funciones locales. El cliente NO sabe cómo están implementadas,
//? solo las llama pasando argumentos y esperando un resultado (callback).
//
//* FLUJO GENERAL:
//*   1. El servidor define funciones (procedimientos)
//*   2. Las registra en una "app" con un nombre
//*   3. El cliente se conecta a esa app por su nombre y llama a los procedimientos
// ======================================================================


// ======================================================================
// DATOS INICIALES datos.js
// ======================================================================
var sanitarios = datos.sanitarios;
var categorias = datos.categorias;
var modelos = datos.modelos;
var recursos = datos.recursos;
var reservas = datos.reservas;
var resenyas = datos.resenyas;

// ======================================================================
//* PROCEDIMIENTOS RPC
// ======================================================================
//? Hay DOS tipos de procedimientos según cómo devuelven el resultado:
//
//* SÍNCRONOS (registerSync): la función devuelve el resultado con RETURN.
//   Se usan cuando el resultado está disponible inmediatamente.
//   function miFuncion() { return datos; }
//
//* ASÍNCRONOS (registerAsync): la función recibe un CALLBACK como último
//   argumento y lo llama cuando tiene el resultado.
//   function miFuncion(arg1, arg2, callback) { callback(resultado); }
// ======================================================================
 
//? --- Sincrono: devuelve con return ---

// Devuelve el array completo de categorías
function obtenerCategorias() {
    return categorias;
}

// Devuelve el array completo de modelos
function obtenerModelos() {
    return modelos;
}
 
//? --- Asincrono: devuelve con callback ---

function loginSanitario(user, password, callback) {
    // .find() recorre el array y devuelve el PRIMER objeto que cumpla la condición
    // Si no encuentra ninguno, devuelve undefined (falsy)
    var sanitario = sanitarios.find(s => s.user === user && s.pswd === password);
    // Si sanitario existe -> devuelve su id, si no -> null
    callback(sanitario ? sanitario.id : null);
}
 
//* REGISTRO DE NUEVO SANITARIO
// Se comprueba que el login no esté ya en uso (debe ser único) (AG1, MAAR, etc...)
// Devuelve: el id del nuevo sanitario (último ID (tamaño de la lista de sanitarios) + 1), o null si el login ya existe
function crearSanitario(datosSanitario, callback) {
    var existe = sanitarios.find(s => s.user === datosSanitario.user);
    if (existe) {
        return callback(null); // Login ya en uso, no se crea el sanitario
    }
 
    var nuevoId = (sanitarios.length + 1).toString(); // Lo guardo en String por que todos los id los tengo como string, aunque sean números
    var nuevo = {
        id: nuevoId,
        nom: datosSanitario.nom,
        ape: datosSanitario.ape,
        user: datosSanitario.user,
        pswd: datosSanitario.pswd
    };
    sanitarios.push(nuevo); // El método push() añade un nuevo elemento al final del array
    callback(nuevoId);
}

//* EDITAR DATOS DE UN SANITARIO
// Devuelve: true si se actualizó bien, null si no existe o el login ya está en uso
function actualizarSanitario(idSanitario, datosSanitario, callback) {
    // .findIndex() devuelve la POSICIÓN en el array, o -1 si no lo encuentra
    // Utilizo la posición para poder modificar: sanitarios[indice].nom = ...
    var indice = sanitarios.findIndex(s => s.id === idSanitario);
    if (indice === -1) {
        return callback(null); // No existe el sanitario, no se puede actualizar
    }
 
    // Se puede dar el caso que eliga un login que ya esté en uso por otro sanitario, lo cual no se puede (LOGIN UNICO (AG1, MAAR, etc...))
    // (el propio puede mantener su login actual, por eso s.id !== idSanitario)
    var loginDuplicado = sanitarios.find(s => s.user === datosSanitario.user && s.id !== idSanitario);
    if (loginDuplicado) {
        return callback(null); // Login ya en uso por otro sanitario, no se puede actualizar
    }
 
    sanitarios[indice].nom = datosSanitario.nom;
    sanitarios[indice].ape = datosSanitario.ape;
    sanitarios[indice].user = datosSanitario.user;
    sanitarios[indice].pswd = datosSanitario.pswd;
 
    callback(true);
}


//* OBTENER DATOS devuelve los datos de un sanitario SIN la contraseña
//? Devuelve: objeto con id, nom, ape, user — o null si no existe

function obtenerSanitario(idSanitario, callback) {
    var sanitario = sanitarios.find(s => s.id === idSanitario);
    if (!sanitario) {
        return callback(null); // No existe el sanitario, no se pueden obtener los datos
    }
    // Devuelve todo menos la contraseña (pswd)
    callback({ id: sanitario.id, nom: sanitario.nom, ape: sanitario.ape, user: sanitario.user });
}


//* BUSCAR RECURSOS devuelve los recursos operativos de un modelo
function obtenerRecursos(idModelo, callback) {
    // Solo recursos operativos (estado "0") del modelo pedido
    var resultado = recursos.filter(r => r.modelo === idModelo && r.estado === "0");
    callback(resultado);
}

//* OBTENER UN RECURSO
// Si no esiste pues devuelve null, si existe devuelve el recurso completo (con su estado, modelo, etc...)
function obtenerRecurso(idRecurso, callback) {
    var recurso = recursos.find(r => r.id === idRecurso);
    callback(recurso || null);
}


//* TIEMPO PENDIENTE calcula cuántas horas faltan para que un recurso esté libre
// Devuelve horas restantes, o 0 si ya está disponible
function tiempoPendiente(idRecurso, callback) {
    var ahora = new Date();
 
    // Busco todas las reservas activas o pendientes de ese recurso
    // (tienen fecha_inicio pero no fecha_fin, o no tienen fecha_inicio aún)
    var reservasActivas = reservas.filter(r => r.recurso === idRecurso && !r.fecha_fin);
 
    if (reservasActivas.length === 0) {
        return callback(0); // ninguna reserva activa -> disponible
    }
 
    // Calculo la fecha más lejana estimada de devolución
    var tiempoMaxFin = ahora;

    reservasActivas.forEach(r => {
        var base = r.fecha_inicio ? new Date(r.fecha_inicio) : ahora;
        var estimadoFin = new Date(base.getTime() + r.horas_estimadas * 60 * 60 * 1000);
        if (estimadoFin > tiempoMaxFin) {
            tiempoMaxFin = estimadoFin;
        }
    });
 
    // Horas restantes desde ahora hasta el fin estimado más lejano
    var horasRestantes = (tiempoMaxFin - ahora) / (1000 * 60 * 60);
    callback(Math.max(0, Math.round(horasRestantes * 10) / 10));
}

//* OBTENER RESERVAS devuelve todas las reservas de un sanitario
// Se separan en pendientes (fecha_inicio==null) y realizadas (fecha_inicio!=null)
function obtenerReservas(idSanitario, callback) {
    var reservasSanitario = reservas.filter(r => r.sanitario === idSanitario); // .filter() devuelve un array con todas las reservas que cumplan la condición, o un array vacío si no hay ninguna
    callback(reservasSanitario); // Devuelve un array, aunque no tenga reservas (array vacío)
}

//* OBTENER RESEÑAS devuelve todas las reseñas de un recurso
function obtenerResenyas(idRecurso, callback) {
    var resenyasRecurso = resenyas.filter(r => r.recurso === idRecurso); // .filter() devuelve un array con todas las reseñas que cumplan la condición, o un array vacío si no hay ninguna
    callback(resenyasRecurso); // Devuelve un array, aunque no tenga reseñas (array vacío)
}


//* CREAR RESEÑA registra una nueva reseña de un sanitario sobre un recurso
function crearResenya(idRecurso, idSanitario, valoracion, descripcion, callback) {
    var nuevoId = (resenyas.length + 1).toString(); // Nuevo ID + Pasarlo a String por que todos los id los tengo como string, aunque sean números
    var nueva = {
        id: nuevoId,
        recurso: idRecurso,
        sanitario: idSanitario,
        fecha: new Date(), // Fecha actual
        valor: valoracion,
        descripcion: descripcion
    };
    resenyas.push(nueva); // El método push() añade un nuevo elemento al final del array
    callback(nuevoId);
}

//* RESERVAR crea una reserva en estado "pendiente" (sin fechas de inicio/fin)
// El sanitario ha pedido el recurso pero todavía no lo ha retirado físicamente
function reservarRecurso(idRecurso, idSanitario, horasEstimadas, callback) {
    var recurso = recursos.find(r => r.id === idRecurso); // Compruebo que el recurso existe
    if (!recurso) {
        return callback(null); // No existe el recurso, no se puede reservar
    }
 
    var nuevoId = (reservas.length + 1).toString();
    var nueva = {
        id: nuevoId,
        recurso: idRecurso,
        sanitario: idSanitario,
        horas_estimadas: horasEstimadas,
        fecha_peticion: new Date(),     // momento en que se hace la reserva
        fecha_inicio: null,             // null = aún no retirado
        fecha_fin: null                 // null = aún no devuelto
    };
    reservas.push(nueva);
    callback(nuevoId);
}


//* CANCELAR RESERVA elimina una reserva pendiente del array
function cancelarReserva(idReserva, callback) {
    var indice = reservas.findIndex(r => r.id === idReserva); // Compruebo que la reserva existe
    if (indice === -1) {
        return callback(null); // No existe la reserva, no se puede cancelar
    }    // .splice(posicion, cantidad)
    reservas.splice(indice, 1); // El método splice() cambia el contenido de un array eliminando elementos existentes y/o agregando nuevos elementos
    callback(true);
}

//* INICIAR RESERVA el sanitario retira el recurso físicamente
function iniciarReserva(idReserva, callback) {
    var reserva = reservas.find(r => r.id === idReserva); // Compruebo que la reserva existe
    if (!reserva) {
        return callback(null); // No existe la reserva, no se puede iniciar
    }
    reserva.fecha_inicio = new Date(); // Se asigna la fecha de inicio (momento en que se retira el recurso)
    callback(true);
}

//* FINALIZAR RESERVA
// Pone fecha_fin = ahora. La reserva pasa de "en uso" a "finalizada"
function finalizarReserva(idReserva, callback) {
    var reserva = reservas.find(r => r.id === idReserva); // Compruebo que la reserva existe
    if (!reserva) {
        return callback(null); // No existe la reserva, no se puede finalizar 
    }
    reserva.fecha_fin = new Date(); // Asigno la fecha de fin
    callback(true);
}

var servidor = rpc.server(); // crear el servidor RPC
var app = servidor.createApp("gestion_sanitarios"); // crear aplicación de RPC

// ======================================================================
//* Paso 2: Registrar los procedimientos
// ======================================================================
app.registerSync(obtenerCategorias);
app.registerSync(obtenerModelos);
app.registerAsync(loginSanitario);
app.registerAsync(crearSanitario);
app.registerAsync(actualizarSanitario);
app.registerAsync(obtenerSanitario);
app.registerAsync(obtenerRecursos);
app.registerAsync(obtenerRecurso);
app.registerAsync(tiempoPendiente);
app.registerAsync(obtenerReservas);
app.registerAsync(obtenerResenyas);
app.registerAsync(crearResenya);
app.registerAsync(reservarRecurso);
app.registerAsync(cancelarReserva);
app.registerAsync(iniciarReserva);
app.registerAsync(finalizarReserva);


