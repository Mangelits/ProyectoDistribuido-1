//Es necesario instalar en la carpeta del servidor los modulos cors y express

var rpc = require("./rpc.js"); //incorporamos la libreria
var bd  = require("./bd.js");  // conexión a la base de datos (antes: datos.js)


// ======================================================================
// RPC CON BASE DE DATOS  (para entenderlo perfectamente)
// ======================================================================
//
//? ¿QUÉ ES RPC? Remote Procedure Call. El cliente llama a una función del
//  servidor COMO SI FUERA LOCAL, pasando argumentos y esperando resultado:
//        loginRPC("FGL", "1234", function(id) { ... });
//  No sabe que por debajo eso es un POST a /RPC/gestion_sanitarios/...
//  Esa "magia" la hace la librería rpc.js. En RPC piensas en FUNCIONES y
//  argumentos (en REST, en URLs y verbos). Este servidor (puerto 3501) lo
//  usa el CLIENTE SANITARIO.
//
// ---------------------------------------------------------------------
//  CÓMO EJECUTA rpc.js UN PROCEDIMIENTO (esto es CLAVE). Dentro de rpc.js:
//        if (procedure.async) procedure.fnct(...params, end); // ASÍNCRONO
//        else                 end(procedure.fnct(...params));  // SÍNCRONO
//  Traducido:
//    - registerSync : RPC usa tu RETURN en el acto.
//    - registerAsync: RPC te pasa una función extra 'end' (el CALLBACK) y
//                     ESPERA a que tú la llames con el resultado. 'end' es
//                     quien realmente responde al cliente.
//
// ---------------------------------------------------------------------
//  ¡¡EL CAMBIO CRÍTICO TRAS PASAR A BASE DE DATOS!!
//  Una consulta a la BD TARDA (viaja por red). Si dejaras la función
//  síncrona, el "return categorias" se ejecutaría ANTES de que la BD
//  conteste -> devolvería undefined. Por eso, EN CUANTO UNA FUNCIÓN TOCA
//  LA BD, tiene que ser registerAsync y entregar el resultado por callback.
//    -> obtenerCategorias y obtenerModelos, que antes eran registerSync,
//       AHORA son registerAsync. Es el error que más se olvida y NO da
//       error visible: el cliente simplemente recibiría undefined.
//
// ---------------------------------------------------------------------
//  PATRÓN .then()/.catch()  (aquí usamos esto en vez de await; hacen lo
//  mismo: "espera a la promesa", pero encaja mejor con el estilo callback):
//        bd.query("SELECT ...", [params])
//           .then(([filas]) => callback(<resultado>))  // cuando conteste
//           .catch(()       => callback(<valor error>)); // si algo falla
//
//  OPERACIONES DE VARIOS PASOS: si una consulta depende de otra (p.ej.
//  "comprueba que el login no existe y SOLO entonces inserta"), se meten
//  los .then() unos dentro de otros (ver crearSanitario / iniciarReserva).
//
//  LÓGICA DE NEGOCIO (fechas, colas): traes las filas de la BD y tu
//  JavaScript de siempre funciona igual sobre esos objetos. En SQL, lo
//  "vacío" se comprueba con  fecha_inicio IS NULL  (antes: !r.fecha_inicio).
// ======================================================================


//? --- Antes SÍNCRONOS, AHORA asíncronos (con callback) ---

// Devuelve el array completo de categorías
function obtenerCategorias(callback) {
    // -----------------------------------------------------------------
    // BLOQUE bd (patrón base de TODO el RPC con BD):
    //  - bd.query(...) devuelve una PROMESA (el resultado llega "más tarde").
    //  - .then(([filas]) => ...): cuando MariaDB contesta, recibimos
    //    [filas, metadatos]; con ([filas]) cogemos SOLO las filas y las
    //    entregamos al cliente llamando a callback(filas).
    //  - .catch(() => callback([])): si la consulta falla, devolvemos un
    //    array vacío en vez de romper.
    //  Aquí está el motivo de que esta función sea registerAsync y NO
    //  registerSync: el resultado NO existe todavía cuando la función
    //  termina; solo llega dentro del .then, por eso se entrega por callback.
    // -----------------------------------------------------------------
    bd.query("SELECT * FROM categorias")
      .then(([filas]) => callback(filas))
      .catch(() => callback([]));
}

// Devuelve el array completo de modelos
function obtenerModelos(callback) {
    // BLOQUE bd: mismo patrón que obtenerCategorias. SELECT de todos los
    // modelos; entregamos el array de filas por el callback (o [] si falla).
    bd.query("SELECT * FROM modelos")
      .then(([filas]) => callback(filas))
      .catch(() => callback([]));
}

//? --- Asíncronos: devuelven con callback ---

function loginSanitario(user, password, callback) {
    // BLOQUE bd: SELECT con filtro (los ? = [user, password]). Devuelve 0 o
    // 1 filas. Dentro del .then decidimos: si hay fila -> callback(su id);
    // si no -> callback(null). El cliente interpreta null como "login malo".
    bd.query("SELECT * FROM sanitarios WHERE user = ? AND pswd = ?", [user, password])
      .then(([filas]) => callback(filas.length > 0 ? filas[0].id : null))
      .catch(() => callback(null));
}

//* REGISTRO DE NUEVO SANITARIO (el login debe ser único)
// Devuelve: el id nuevo (lo asigna AUTO_INCREMENT) o null si el login ya existe
function crearSanitario(datosSanitario, callback) {
    // -----------------------------------------------------------------
    // BLOQUE bd: DOS consultas ENCADENADAS (una depende de la otra).
    //  Como cada consulta es asíncrona, la segunda va DENTRO del .then de
    //  la primera. Este es el patrón para operaciones de varios pasos.
    //   Paso 1: SELECT id -> ¿ya existe alguien con ese user?
    //   Paso 2: solo si NO existe, INSERT del nuevo sanitario.
    //  El "return callback(null)" corta la cadena si el login ya está en uso.
    //  Tras el INSERT, resultado.insertId es el id que puso AUTO_INCREMENT.
    // -----------------------------------------------------------------
    bd.query("SELECT id FROM sanitarios WHERE user = ?", [datosSanitario.user])
      .then(([existe]) => {
          if (existe.length > 0) return callback(null); // login ya en uso -> corta
          return bd.query(
              "INSERT INTO sanitarios (nom, ape, user, pswd) VALUES (?, ?, ?, ?)",
              [datosSanitario.nom, datosSanitario.ape, datosSanitario.user, datosSanitario.pswd]
          ).then(([resultado]) => callback(resultado.insertId)); // id nuevo
      })
      .catch(() => callback(null));
}

//* EDITAR DATOS DE UN SANITARIO
// Devuelve: true si se actualizó, null si no existe o el login ya está en uso por otro
function actualizarSanitario(idSanitario, datosSanitario, callback) {
    // -----------------------------------------------------------------
    // BLOQUE bd: TRES consultas encadenadas (.then dentro de .then).
    //   Paso 1: ¿existe el sanitario? (si no -> callback(null)).
    //   Paso 2: ¿otro sanitario usa ya ese user? (id <> ? excluye a él
    //           mismo, para que pueda conservar su propio login).
    //   Paso 3: si todo ok, UPDATE de sus datos y callback(true).
    //  Cada paso solo se ejecuta si el anterior lo permite; cualquier
    //  "return callback(null)" corta la cadena entera.
    // -----------------------------------------------------------------
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
              ).then(() => callback(true)); // actualizado correctamente
          });
      })
      .catch(() => callback(null));
}

//* OBTENER DATOS de un sanitario SIN la contraseña
function obtenerSanitario(idSanitario, callback) {
    // BLOQUE bd: SELECT de UN sanitario, listando solo columnas seguras
    // (sin pswd, igual que en REST). callback(filas[0]) o callback(null).
    bd.query("SELECT id, nom, ape, user FROM sanitarios WHERE id = ?", [idSanitario])
      .then(([filas]) => callback(filas.length > 0 ? filas[0] : null))
      .catch(() => callback(null));
}

//* BUSCAR RECURSOS operativos (estado "0") de un modelo
function obtenerRecursos(idModelo, callback) {
    // BLOQUE bd: SELECT con DOS condiciones. modelo = ? (el ? es idModelo) y
    // estado = '0' (operativo) escrito fijo en el SQL porque es una constante,
    // no un dato variable. Devuelve el array de recursos disponibles de ese modelo.
    bd.query("SELECT * FROM recursos WHERE modelo = ? AND estado = '0'", [idModelo])
      .then(([filas]) => callback(filas))
      .catch(() => callback([]));
}

//* OBTENER UN RECURSO (null si no existe)
function obtenerRecurso(idRecurso, callback) {
    // BLOQUE bd: SELECT de UN recurso por id. callback(filas[0]) si existe,
    // callback(null) si no. El cliente usa null para saltarse ese recurso.
    bd.query("SELECT * FROM recursos WHERE id = ?", [idRecurso])
      .then(([filas]) => callback(filas.length > 0 ? filas[0] : null))
      .catch(() => callback(null));
}

//* TIEMPO PENDIENTE: horas que faltan para que el recurso esté físicamente libre.
// Solo cuentan las reservas EN USO (fecha_inicio puesta, fecha_fin nula).
// Traemos esas filas de la BD y hacemos el cálculo en JS (idéntico al original).
function tiempoPendiente(idRecurso, callback) {
    // -----------------------------------------------------------------
    // BLOQUE bd: SELECT que trae SOLO las reservas EN USO de ese recurso.
    //  "en uso" = tiene fecha_inicio Y no tiene fecha_fin. En SQL eso se
    //  expresa con  fecha_inicio IS NOT NULL AND fecha_fin IS NULL  (fíjate:
    //  para comparar con NULL se usa IS NULL / IS NOT NULL, nunca = NULL).
    //  Esto sustituye al viejo .filter(r => r.fecha_inicio && !r.fecha_fin).
    //  Después NO hacemos más SQL: el cálculo de horas se hace en JS sobre
    //  las filas devueltas (son objetos normales, con sus fechas como Date).
    // -----------------------------------------------------------------
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
    // -----------------------------------------------------------------
    // BLOQUE bd: DOS consultas encadenadas, cada una responde una pregunta.
    //   Paso 1: ¿lo está USANDO alguien? (inicio puesto, fin nulo). Si sí,
    //           no está disponible -> callback(false) y corta.
    //   Paso 2: ¿hay alguien EN COLA? (reservas sin fecha_inicio). Solo está
    //           disponible si NO hay cola: callback(enCola.length === 0).
    //  Usamos SELECT id (no *) porque solo necesitamos contar, no los datos.
    // -----------------------------------------------------------------
    bd.query(
        "SELECT id FROM reservas WHERE recurso = ? AND fecha_inicio IS NOT NULL AND fecha_fin IS NULL",
        [idRecurso]
    )
    .then(([enUso]) => {
        if (enUso.length > 0) return callback(false); // lo está usando alguien
        return bd.query(
            "SELECT id FROM reservas WHERE recurso = ? AND fecha_inicio IS NULL",
            [idRecurso]
        ).then(([enCola]) => callback(enCola.length === 0)); // libre solo si no hay cola
    })
    .catch(() => callback(false));
}

//* PUEDE RETIRAR RESERVA: la reserva sigue pendiente, el recurso no está en uso,
// y es la más antigua (fecha_peticion) de la cola de ese recurso.
function puedeRetirarReserva(idReserva, callback) {
    // -----------------------------------------------------------------
    // BLOQUE bd: TRES consultas encadenadas para responder "¿puede esta
    // reserva concreta retirarse YA?".
    //   Paso 1: traer la reserva. Si no existe o ya está iniciada -> false.
    //   Paso 2: ¿el recurso lo está usando alguien? -> si sí, false.
    //   Paso 3: cola FIFO. ORDER BY fecha_peticion ASC LIMIT 1 devuelve la
    //           reserva pendiente MÁS ANTIGUA del recurso. Solo puede retirar
    //           si esa primera de la cola es precisamente ESTA reserva
    //           (primeros[0].id === reserva.id). Aquí SQL hace el trabajo de
    //           ordenar por fecha que antes hacía un .sort() en JavaScript.
    // -----------------------------------------------------------------
    bd.query("SELECT * FROM reservas WHERE id = ?", [idReserva])
      .then(([filas]) => {
          var reserva = filas[0];
          if (!reserva || reserva.fecha_inicio) return callback(false); // no existe o ya iniciada

          return bd.query(
              "SELECT id FROM reservas WHERE recurso = ? AND fecha_inicio IS NOT NULL AND fecha_fin IS NULL",
              [reserva.recurso]
          ).then(([enUso]) => {
              if (enUso.length > 0) return callback(false); // en uso por alguien

              return bd.query(
                  "SELECT id FROM reservas WHERE recurso = ? AND fecha_inicio IS NULL ORDER BY fecha_peticion ASC LIMIT 1",
                  [reserva.recurso]
              ).then(([primeros]) => {
                  // ¿es esta reserva la primera de la cola? -> true/false
                  callback(primeros.length > 0 && primeros[0].id === reserva.id);
              });
          });
      })
      .catch(() => callback(false));
}

//* OBTENER RESERVAS de un sanitario (el cliente las separa en pendientes/realizadas)
function obtenerReservas(idSanitario, callback) {
    // BLOQUE bd: SELECT con filtro por sanitario (un .filter()). Devuelve
    // TODAS sus reservas (pendientes y realizadas); es el CLIENTE quien
    // luego las separa mirando si fecha_inicio es null o no.
    bd.query("SELECT * FROM reservas WHERE sanitario = ?", [idSanitario])
      .then(([filas]) => callback(filas))
      .catch(() => callback([]));
}

//* OBTENER RESEÑAS de un recurso
function obtenerResenyas(idRecurso, callback) {
    // BLOQUE bd: SELECT con filtro por recurso. Devuelve todas sus reseñas
    // (0, 1 o muchas). El cliente calcula la media de 'valor' con ellas.
    bd.query("SELECT * FROM resenyas WHERE recurso = ?", [idRecurso])
      .then(([filas]) => callback(filas))
      .catch(() => callback([]));
}

//* CREAR RESEÑA (la fecha la pone la BD con NOW(); el id con AUTO_INCREMENT)
function crearResenya(idRecurso, idSanitario, valoracion, descripcion, callback) {
    // -----------------------------------------------------------------
    // BLOQUE bd: INSERT de una reseña.
    //  - Fíjate en NOW(): es una función de SQL que pone la fecha/hora
    //    actual del servidor. Va escrita fija en el texto (no es un ?),
    //    por eso el array de valores solo tiene 4 elementos aunque haya 5
    //    columnas: los otros 4 ? son recurso, sanitario, valor, descripcion.
    //  - resultado.insertId es el id que asignó AUTO_INCREMENT; lo devolvemos
    //    para que el cliente sepa que se creó (número > 0 = éxito).
    // -----------------------------------------------------------------
    bd.query(
        "INSERT INTO resenyas (recurso, sanitario, fecha, valor, descripcion) VALUES (?, ?, NOW(), ?, ?)",
        [idRecurso, idSanitario, valoracion, descripcion]
    )
    .then(([resultado]) => callback(resultado.insertId))
    .catch(() => callback(null));
}

//* RESERVAR: crea una reserva pendiente (sin fechas de inicio/fin)
function reservarRecurso(idRecurso, idSanitario, horasEstimadas, callback) {
    // -----------------------------------------------------------------
    // BLOQUE bd: comprobar + insertar (2 consultas encadenadas).
    //   Paso 1: ¿existe el recurso? Si no -> callback(null).
    //   Paso 2: INSERT de la reserva en estado PENDIENTE. Fíjate en los
    //           valores fijos del SQL: fecha_peticion = NOW() (ahora), y
    //           fecha_inicio = NULL y fecha_fin = NULL (aún no retirado ni
    //           devuelto). Los ? son recurso, sanitario y horas_estimadas.
    //   Devolvemos resultado.insertId (el id de la nueva reserva).
    // -----------------------------------------------------------------
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
    // BLOQUE bd: DELETE de la reserva (un .splice()). resultado.affectedRows
    // dice cuántas filas se borraron: si es > 0 se borró -> true; si es 0
    // esa reserva no existía -> null. El WHERE id = ? limita a esa reserva.
    bd.query("DELETE FROM reservas WHERE id = ?", [idReserva])
      .then(([resultado]) => callback(resultado.affectedRows > 0 ? true : null))
      .catch(() => callback(null));
}

//* INICIAR RESERVA: el sanitario retira el recurso. Validaciones en servidor:
// no iniciada ya, recurso no en uso por otra reserva, y es su turno (FIFO).
function iniciarReserva(idReserva, callback) {
    // -----------------------------------------------------------------
    // BLOQUE bd: el más completo. CUATRO consultas encadenadas que validan,
    // paso a paso, si el sanitario puede retirar el recurso AHORA:
    //   Paso 1: traer la reserva. Si no existe o ya tiene fecha_inicio -> null.
    //   Paso 2: ¿otra reserva DISTINTA (id <> ?) está usando el recurso?
    //           (inicio puesto, fin nulo). Si sí -> null.
    //   Paso 3: cola FIFO. ¿hay alguna reserva pendiente ANTERIOR a la suya?
    //           (fecha_peticion < la de esta reserva). Si la hay, no es su
    //           turno todavía -> null.
    //   Paso 4: si supera todo, UPDATE fecha_inicio = NOW() (queda "en uso")
    //           y callback(true).
    //  Estas validaciones en el SERVIDOR evitan que dos sanitarios retiren
    //  el mismo recurso a la vez (carreras).
    // -----------------------------------------------------------------
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
                  ).then(() => callback(true)); // retirado con éxito
              });
          });
      })
      .catch(() => callback(null));
}

//* FINALIZAR RESERVA: pone fecha_fin = ahora
function finalizarReserva(idReserva, callback) {
    // BLOQUE bd: UPDATE que pone fecha_fin = NOW() (la reserva pasa de "en
    // uso" a "finalizada"). affectedRows > 0 significa que la reserva existía
    // y se actualizó -> true; si es 0, no existía -> null.
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
