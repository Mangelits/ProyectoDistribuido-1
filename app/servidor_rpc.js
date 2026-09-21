//Es necesario instalar en la carpeta del servidor los modulos cors y express

var rpc = require("./rpc.js"); //incorporamos la libreria
var bd  = require("./bd.js");  // conexión a la base de datos (antes: datos.js)


// ======================================================================
//? RPC (Remote Procedure Call): el cliente llama a funciones del servidor
//? como si fueran locales, pasando argumentos y esperando un resultado.
// ======================================================================
//
//* ¡¡IMPORTANTE TRAS PASAR A BASE DE DATOS!!
//  Una consulta a la BD NO devuelve el resultado en la misma línea: tarda
//  (viaja por la red a MariaDB). Por eso NINGÚN procedimiento puede ser ya
//  SÍNCRONO (registerSync + return): en cuanto se toca la BD, el resultado
//  llega "más tarde" y hay que entregarlo por el CALLBACK (registerAsync).
//
//  -> obtenerCategorias y obtenerModelos, que antes eran registerSync,
//     AHORA son registerAsync (reciben callback). Este es el cambio que
//     más se olvida y no da error: simplemente devolvería undefined.
//
//  Con la versión de promesas del driver usamos:
//     bd.query("SELECT ...", [params])
//        .then(([filas]) => callback(filas))
//        .catch(()       => callback(<valor de error>));
// ======================================================================


//? --- Antes SÍNCRONOS, AHORA asíncronos (con callback) ---

// Devuelve el array completo de categorías
function obtenerCategorias(callback) {
    bd.query("SELECT * FROM categorias")
      .then(([filas]) => callback(filas))
      .catch(() => callback([]));
}

// Devuelve el array completo de modelos
function obtenerModelos(callback) {
    bd.query("SELECT * FROM modelos")
      .then(([filas]) => callback(filas))
      .catch(() => callback([]));
}

//? --- Asíncronos: devuelven con callback ---

function loginSanitario(user, password, callback) {
    bd.query("SELECT * FROM sanitarios WHERE user = ? AND pswd = ?", [user, password])
      .then(([filas]) => callback(filas.length > 0 ? filas[0].id : null))
      .catch(() => callback(null));
}

//* REGISTRO DE NUEVO SANITARIO (el login debe ser único)
// Devuelve: el id nuevo (lo asigna AUTO_INCREMENT) o null si el login ya existe
function crearSanitario(datosSanitario, callback) {
    bd.query("SELECT id FROM sanitarios WHERE user = ?", [datosSanitario.user])
      .then(([existe]) => {
          if (existe.length > 0) return callback(null); // login ya en uso
          return bd.query(
              "INSERT INTO sanitarios (nom, ape, user, pswd) VALUES (?, ?, ?, ?)",
              [datosSanitario.nom, datosSanitario.ape, datosSanitario.user, datosSanitario.pswd]
          ).then(([resultado]) => callback(resultado.insertId)); // id generado
      })
      .catch(() => callback(null));
}

//* EDITAR DATOS DE UN SANITARIO
// Devuelve: true si se actualizó, null si no existe o el login ya está en uso por otro
function actualizarSanitario(idSanitario, datosSanitario, callback) {
    bd.query("SELECT id FROM sanitarios WHERE id = ?", [idSanitario])
      .then(([existe]) => {
          if (existe.length === 0) return callback(null); // no existe
          return bd.query(
              "SELECT id FROM sanitarios WHERE user = ? AND id <> ?",
              [datosSanitario.user, idSanitario]
          ).then(([duplicado]) => {
              if (duplicado.length > 0) return callback(null); // login en uso por otro
              return bd.query(
                  "UPDATE sanitarios SET nom = ?, ape = ?, user = ?, pswd = ? WHERE id = ?",
                  [datosSanitario.nom, datosSanitario.ape, datosSanitario.user, datosSanitario.pswd, idSanitario]
              ).then(() => callback(true));
          });
      })
      .catch(() => callback(null));
}

//* OBTENER DATOS de un sanitario SIN la contraseña
function obtenerSanitario(idSanitario, callback) {
    bd.query("SELECT id, nom, ape, user FROM sanitarios WHERE id = ?", [idSanitario])
      .then(([filas]) => callback(filas.length > 0 ? filas[0] : null))
      .catch(() => callback(null));
}

//* BUSCAR RECURSOS operativos (estado "0") de un modelo
function obtenerRecursos(idModelo, callback) {
    bd.query("SELECT * FROM recursos WHERE modelo = ? AND estado = '0'", [idModelo])
      .then(([filas]) => callback(filas))
      .catch(() => callback([]));
}

//* OBTENER UN RECURSO (null si no existe)
function obtenerRecurso(idRecurso, callback) {
    bd.query("SELECT * FROM recursos WHERE id = ?", [idRecurso])
      .then(([filas]) => callback(filas.length > 0 ? filas[0] : null))
      .catch(() => callback(null));
}

//* TIEMPO PENDIENTE: horas que faltan para que el recurso esté físicamente libre.
// Solo cuentan las reservas EN USO (fecha_inicio puesta, fecha_fin nula).
// Traemos esas filas de la BD y hacemos el cálculo en JS (idéntico al original).
function tiempoPendiente(idRecurso, callback) {
    bd.query(
        "SELECT * FROM reservas WHERE recurso = ? AND fecha_inicio IS NOT NULL AND fecha_fin IS NULL",
        [idRecurso]
    )
    .then(([reservasActivas]) => {
        if (reservasActivas.length === 0) return callback(0); // libre

        var ahora = new Date();
        var tiempoMaxFin = ahora;
        reservasActivas.forEach(r => {
            var base = new Date(r.fecha_inicio);
            var estimadoFin = new Date(base.getTime() + r.horas_estimadas * 60 * 60 * 1000);
            if (estimadoFin > tiempoMaxFin) tiempoMaxFin = estimadoFin;
        });

        var horasRestantes = (tiempoMaxFin - ahora) / (1000 * 60 * 60);
        callback(Math.max(0, Math.round(horasRestantes * 10) / 10));
    })
    .catch(() => callback(0));
}

//* RECURSO DISPONIBLE: true solo si nadie lo usa Y nadie está en cola.
function recursoDisponible(idRecurso, callback) {
    // ¿Alguien lo está usando? (inicio puesto, fin nulo)
    bd.query(
        "SELECT id FROM reservas WHERE recurso = ? AND fecha_inicio IS NOT NULL AND fecha_fin IS NULL",
        [idRecurso]
    )
    .then(([enUso]) => {
        if (enUso.length > 0) return callback(false);
        // ¿Alguien en cola? (sin fecha_inicio)
        return bd.query(
            "SELECT id FROM reservas WHERE recurso = ? AND fecha_inicio IS NULL",
            [idRecurso]
        ).then(([enCola]) => callback(enCola.length === 0));
    })
    .catch(() => callback(false));
}

//* PUEDE RETIRAR RESERVA: la reserva sigue pendiente, el recurso no está en uso,
// y es la más antigua (fecha_peticion) de la cola de ese recurso.
function puedeRetirarReserva(idReserva, callback) {
    bd.query("SELECT * FROM reservas WHERE id = ?", [idReserva])
      .then(([filas]) => {
          var reserva = filas[0];
          if (!reserva || reserva.fecha_inicio) return callback(false);

          return bd.query(
              "SELECT id FROM reservas WHERE recurso = ? AND fecha_inicio IS NOT NULL AND fecha_fin IS NULL",
              [reserva.recurso]
          ).then(([enUso]) => {
              if (enUso.length > 0) return callback(false);

              return bd.query(
                  "SELECT id FROM reservas WHERE recurso = ? AND fecha_inicio IS NULL ORDER BY fecha_peticion ASC LIMIT 1",
                  [reserva.recurso]
              ).then(([primeros]) => {
                  callback(primeros.length > 0 && primeros[0].id === reserva.id);
              });
          });
      })
      .catch(() => callback(false));
}

//* OBTENER RESERVAS de un sanitario (el cliente las separa en pendientes/realizadas)
function obtenerReservas(idSanitario, callback) {
    bd.query("SELECT * FROM reservas WHERE sanitario = ?", [idSanitario])
      .then(([filas]) => callback(filas))
      .catch(() => callback([]));
}

//* OBTENER RESEÑAS de un recurso
function obtenerResenyas(idRecurso, callback) {
    bd.query("SELECT * FROM resenyas WHERE recurso = ?", [idRecurso])
      .then(([filas]) => callback(filas))
      .catch(() => callback([]));
}

//* CREAR RESEÑA (la fecha la pone la BD con NOW(); el id con AUTO_INCREMENT)
function crearResenya(idRecurso, idSanitario, valoracion, descripcion, callback) {
    bd.query(
        "INSERT INTO resenyas (recurso, sanitario, fecha, valor, descripcion) VALUES (?, ?, NOW(), ?, ?)",
        [idRecurso, idSanitario, valoracion, descripcion]
    )
    .then(([resultado]) => callback(resultado.insertId))
    .catch(() => callback(null));
}

//* RESERVAR: crea una reserva pendiente (sin fechas de inicio/fin)
function reservarRecurso(idRecurso, idSanitario, horasEstimadas, callback) {
    bd.query("SELECT id FROM recursos WHERE id = ?", [idRecurso])
      .then(([recurso]) => {
          if (recurso.length === 0) return callback(null); // no existe el recurso
          return bd.query(
              "INSERT INTO reservas (recurso, sanitario, horas_estimadas, fecha_peticion, fecha_inicio, fecha_fin) VALUES (?, ?, ?, NOW(), NULL, NULL)",
              [idRecurso, idSanitario, horasEstimadas]
          ).then(([resultado]) => callback(resultado.insertId));
      })
      .catch(() => callback(null));
}

//* CANCELAR RESERVA: elimina una reserva
function cancelarReserva(idReserva, callback) {
    bd.query("DELETE FROM reservas WHERE id = ?", [idReserva])
      .then(([resultado]) => callback(resultado.affectedRows > 0 ? true : null))
      .catch(() => callback(null));
}

//* INICIAR RESERVA: el sanitario retira el recurso. Validaciones en servidor:
// no iniciada ya, recurso no en uso por otra reserva, y es su turno (FIFO).
function iniciarReserva(idReserva, callback) {
    bd.query("SELECT * FROM reservas WHERE id = ?", [idReserva])
      .then(([filas]) => {
          var reserva = filas[0];
          if (!reserva) return callback(null);          // no existe
          if (reserva.fecha_inicio) return callback(null); // ya iniciada

          return bd.query(
              "SELECT id FROM reservas WHERE recurso = ? AND fecha_inicio IS NOT NULL AND fecha_fin IS NULL AND id <> ?",
              [reserva.recurso, reserva.id]
          ).then(([enUso]) => {
              if (enUso.length > 0) return callback(null); // en uso por otra

              return bd.query(
                  "SELECT id FROM reservas WHERE recurso = ? AND fecha_inicio IS NULL AND id <> ? AND fecha_peticion < ?",
                  [reserva.recurso, reserva.id, reserva.fecha_peticion]
              ).then(([anteriores]) => {
                  if (anteriores.length > 0) return callback(null); // no es su turno
                  return bd.query(
                      "UPDATE reservas SET fecha_inicio = NOW() WHERE id = ?",
                      [reserva.id]
                  ).then(() => callback(true));
              });
          });
      })
      .catch(() => callback(null));
}

//* FINALIZAR RESERVA: pone fecha_fin = ahora
function finalizarReserva(idReserva, callback) {
    bd.query("UPDATE reservas SET fecha_fin = NOW() WHERE id = ?", [idReserva])
      .then(([resultado]) => callback(resultado.affectedRows > 0 ? true : null))
      .catch(() => callback(null));
}

var servidor = rpc.server(); // crear el servidor RPC
var app = servidor.createApp("gestion_sanitarios"); // crear aplicación de RPC

// ======================================================================
//* Registrar los procedimientos
//  OJO: obtenerCategorias y obtenerModelos ahora son registerAsync.
// ======================================================================
app.registerAsync(obtenerCategorias);
app.registerAsync(obtenerModelos);
app.registerAsync(loginSanitario);
app.registerAsync(crearSanitario);
app.registerAsync(actualizarSanitario);
app.registerAsync(obtenerSanitario);
app.registerAsync(obtenerRecursos);
app.registerAsync(obtenerRecurso);
app.registerAsync(tiempoPendiente);
app.registerAsync(recursoDisponible);
app.registerAsync(puedeRetirarReserva);
app.registerAsync(obtenerReservas);
app.registerAsync(obtenerResenyas);
app.registerAsync(crearResenya);
app.registerAsync(reservarRecurso);
app.registerAsync(cancelarReserva);
app.registerAsync(iniciarReserva);
app.registerAsync(finalizarReserva);
