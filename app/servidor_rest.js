// node servidor.js
// estoesparaelgamepass2 contraseña
var express = require("express");
var path = require("path");
var app = express();

// Antes: var bd = require('./bd.js')  (MariaDB/MySQL en local)
// Ahora: la base de datos está en Supabase (PostgreSQL en la nube).

// 1. Importar el cliente de Supabase
const { createClient } = require('@supabase/supabase-js');

// 2. Configurar con tu URL y tu Public Key (anon key)
//    Si existen las variables de entorno SUPABASE_URL / SUPABASE_KEY (útil al
//    desplegar en Render) se usan esas; si no, los valores escritos aquí.
const supabaseUrl = process.env.SUPABASE_URL || 'https://brnaacefbccptxevjhhh.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_3s4NAqCghKUCOSXcOw0Esw_xIiUlOiE'; // public (publishable) key
const supabase = createClient(supabaseUrl, supabaseKey);

// PRÁCTICA 3 · PARTE 2: autenticación con JWT
var jwt = require('jwt-simple');
// Clave para firmar (encode) y comprobar (decode) los tokens. Solo la conoce el servidor.
// Se puede cambiar con la variable de entorno JWT_CLAVE (útil al desplegar en la Parte 3).
var CLAVE_JWT = process.env.JWT_CLAVE || 'claveSecretaTelemedicina';
var DURACION_TOKEN = 60 * 60 * 1000; // el token caduca a la hora (en ms)

/*
======================================================================
 REST CON BASE DE DATOS EN SUPABASE  (para entenderlo perfectamente)
======================================================================

 ¿QUÉ ES REST AQUÍ?
   Petición -> respuesta sobre HTTP. El cliente pide algo a una URL con
   un VERBO (GET/POST/PUT/DELETE) y el servidor responde UNA vez. Lo
   monta Express. En REST piensas en URLs y verbos (en RPC, en funciones).
   Este servidor (puerto 3000) lo usa el CLIENTE GESTOR.

 FLUJO DE UNA PETICIÓN (ej. login):
   cliente_rest/main.js  --POST-->  app.post(...)  --supabase-->  PostgreSQL (Supabase)
                                          |                busca
   callback(200, {id,token}) <-- res.json -+  <------- data ---------

 EL PATRÓN DE 3 CAPAS QUE SE REPITE EN TODAS LAS RUTAS:
   app.get("/api/x", async function (req, res) {                  // (1) async
       try {                                                        // (2) try/catch
           var { data, error } = await supabase.from("x").select("*"); // (3) await
           if (error) throw error;
           res.status(200).json(data);
       } catch (err) {
           res.status(500).json("Error en la base de datos");
       }
   });
   (1) async  -> necesario para poder usar await dentro.
   (2) try/catch -> si la BD falla, respondemos 500 en vez de reventar.
   (3) await  -> "espera aquí a que Supabase conteste y luego sigue".

 SUPABASE NO RECIBE TEXTO SQL: se encadenan métodos que equivalen a SQL.
   SELECT * FROM t                     -> supabase.from("t").select("*")
   SELECT id, nom FROM t               -> .select("id, nom")
   ... WHERE col = v                   -> .eq("col", v)
   ... WHERE col <> v                  -> .neq("col", v)
   ... WHERE col IN (a, b)             -> .in("col", [a, b])
   INSERT INTO t (a, b) VALUES (..)    -> supabase.from("t").insert({ a: .., b: .. })
   UPDATE t SET a = .. WHERE id = v    -> supabase.from("t").update({ a: .. }).eq("id", v)
   DELETE FROM t WHERE id = v          -> supabase.from("t").delete().eq("id", v)

 CÓMO LEER EL RESULTADO:  var { data, error } = await supabase.from(...)...;
   - error : null si todo fue bien; si no, el error (lo lanzamos al catch).
   - data  : array de objetos (una fila = un objeto). data.length : cuántos hay.
   - los valores van como parámetros de los métodos, nunca pegados al texto
     de una consulta, así que no hay inyección SQL.
   - tras insert/update/delete, data viene vacío salvo que añadamos .select()
     (lo usamos en el DELETE para saber cuántas filas se han borrado).

 REST vs RPC (mismos datos, distinto "envoltorio"):
   REST responde con  res.status(...).json(...)  y códigos HTTP.
   RPC  responde con  callback(...)              y sin códigos.
======================================================================
*/

app.use("/appCliente", express.static(path.join(__dirname, "cliente_rest")));
app.use("/appSanitario", express.static(path.join(__dirname, "cliente_rpc")));
app.use(express.json());


//! ======================================================================
//! ------------- PRÁCTICA 3 MINISTERIO DE SANIDAD -----------
//! ======================================================================
var MINISTERIO_URL = "https://undefined.ua.es/telemedicina/api/datos";
var ID_AREA = 12; // Neurología

// Devuelve una fecha "YYYY-MM-DD" (sin hora). Se usa para el campo "fecha"
// del envío (la fecha de la subida = hoy).
function fechaHoyYMD() {
    var d = new Date();
    var mes = String(d.getMonth() + 1).padStart(2, "0"); // getMonth() es 0-11 por eso +1
    var dia = String(d.getDate()).padStart(2, "0"); //padStart es para que si es <10 ponga un 0 delante
    return d.getFullYear() + "-" + mes + "-" + dia;
}

// Convierte una fecha que viene de la BD a texto ISO 8601
// "YYYY-MM-DDTHH:MM:SS.sssZ" (en UTC), que es el formato que exige verificar()
// en el cliente. Si es null (reserva sin inicio/fin) devuelve null tal cual,
// para no inventar fechas.
// Con MySQL las fechas ya salían así; PostgreSQL las devuelve como
// "2026-09-05T08:00:00", por eso las normalizamos antes de enviarlas.
function fechaBDaTexto(valor) {
    if (!valor) return null;
    return new Date(valor).toISOString();
}

// ======================================================================
//! ---------------------------- SERVICIOS  -----------------------------
// ======================================================================

/*
! ---------------------------- LOGIN  -----------------------------
POST /api/gestores/login - Login de gestor
*/
app.post("/api/gestores/login", async function (req, res) {
    try {
        // req.body = datos enviados OCULTOS en el cuerpo del POST (no en la
        // URL). Por eso el login usa POST: la contraseña no viaja a la vista.
        var login = req.body.login;
        var password = req.body.password;

        // -------------------------------------------------------------
        // BLOQUE bd: SELECT con FILTRO (equivale a un .find()).
        //  SQL: SELECT * FROM gestores WHERE user = login AND pswd = password
        //  Cada .eq() añade una condición (se unen con AND).
        //  data es SIEMPRE un array (0 o 1 filas); aquí miramos su tamaño.
        // -------------------------------------------------------------
        var { data: filas, error } = await supabase
            .from("gestores")
            .select("*")
            .eq("user", login)
            .eq("pswd", password);
        if (error) throw error;

        if (filas.length > 0) {
            // PARTE 2: login correcto -> creamos un token firmado con la clave.
            // Dentro va el id del gestor y cuándo caduca.
            var contenido = {
                usuario: filas[0].id,
                expira: Date.now() + DURACION_TOKEN
            };
            var token = jwt.encode(contenido, CLAVE_JWT);
            // Devolvemos el id (el cliente lo sigue usando) y el token.
            res.status(200).json({ id: filas[0].id, token: token });
        } else {
            // 0 filas = credenciales incorrectas -> 403 (prohibido).
            res.status(403).json("Login incorrecto");
        }
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

/*
! ---------------------------- REGISTRO  -----------------------------
POST /api/gestores - Crea un nuevo gestor (registro)
*/
app.post("/api/gestores", async function (req, res) {
    try {
        var nuevoGestor = req.body;
        var usernameRecibido = nuevoGestor.login || nuevoGestor.user;

        // -------------------------------------------------------------
        // BLOQUE bd (1 de 2): COMPROBAR QUE EL LOGIN NO EXISTE YA.
        //  SQL: SELECT id FROM gestores WHERE user = usernameRecibido
        //  select("id") (no *) porque solo nos interesa saber si existe.
        // -------------------------------------------------------------
        var { data: existe, error: errorExiste } = await supabase
            .from("gestores")
            .select("id")
            .eq("user", usernameRecibido);
        if (errorExiste) throw errorExiste;
        if (existe.length > 0) {
            // Ya hay alguien con ese login -> cortamos aquí (no insertamos).
            return res.status(403).json("El login ya está en uso");
        }

        // -------------------------------------------------------------
        // BLOQUE bd (2 de 2): INSERT (equivale a .push()).
        //  SQL: INSERT INTO gestores (nom, ape, user, pswd) VALUES (...)
        //  - NO ponemos el id: lo asigna solo la BD (identity/serial).
        //  - Las claves del objeto son los nombres de las columnas.
        // -------------------------------------------------------------
        var { error } = await supabase
            .from("gestores")
            .insert({
                nom: nuevoGestor.nombre || nuevoGestor.nom,
                ape: nuevoGestor.apellidos || nuevoGestor.ape,
                user: usernameRecibido,
                pswd: nuevoGestor.password || nuevoGestor.pswd
            });
        if (error) throw error;

        // 201: creado. Se conserva el mensaje que espera el cliente.
        res.status(201).json("Gestor registrado");
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

//! ======================================================================
//! ------------- PRÁCTICA 3 · PARTE 2: COMPROBACIÓN DEL TOKEN ----------
//! ======================================================================
// Las rutas /api escritas ANTES de este app.use son públicas (login y registro).
// Las escritas DESPUÉS son privadas: Express ejecuta primero esta función y,
// solo si el token es válido, llama a next() para continuar hasta la ruta pedida.
// El token viaja en la URL: /api/recursos?token=XXXXXXXX
app.use("/api", function (req, res, next) {
    var token = req.query.token;
    if (!token) {
        return res.status(301).json("No se ha encontrado token");
    }

    // Decodificar con la misma clave con la que se firmó. Si alguien lo ha
    // modificado o se lo ha inventado, decode lanza un error.
    var contenidoToken;
    try {
        contenidoToken = jwt.decode(token, CLAVE_JWT);
    } catch (error) {
        return res.status(301).json("El token es incorrecto");
    }

    // Validar el formato del contenido
    if (!contenidoToken || !contenidoToken.expira || !contenidoToken.usuario) {
        return res.status(301).json("El formato del token no es adecuado");
    }

    // Comprobar que no ha caducado
    if (contenidoToken.expira < Date.now()) {
        return res.status(301).json("El token ha expirado");
    }

    // Guardamos el id del gestor por si alguna ruta lo necesita
    req.idGestor = contenidoToken.usuario;
    next();
});
// A partir de aquí, todos los servicios /api necesitan token

// GET /api/ubicaciones - Todas las ubicaciones
app.get("/api/ubicaciones", async function (req, res) {
    try {
        // -------------------------------------------------------------
        // BLOQUE bd: SELECT de TODO (equivale a devolver el array entero).
        //  SQL: SELECT * FROM ubicaciones
        //  No lleva filtros porque no hay ningún dato variable.
        //  'ubicaciones' es un array de objetos { id, nom }.
        // -------------------------------------------------------------
        var { data: ubicaciones, error } = await supabase.from("ubicaciones").select("*");
        if (error) throw error;
        res.status(200).json(ubicaciones); // lo enviamos tal cual al cliente
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// GET /api/categorias - Todas las categorías
app.get("/api/categorias", async function (req, res) {
    try {
        // BLOQUE bd: mismo patrón que ubicaciones (SELECT * FROM categorias).
        // 'categorias' es el array de filas { id, nom }.
        var { data: categorias, error } = await supabase.from("categorias").select("*");
        if (error) throw error;
        res.status(200).json(categorias);
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// GET /api/modelos - Todos los modelos
app.get("/api/modelos", async function (req, res) {
    try {
        // BLOQUE bd: SELECT * FROM modelos. 'modelos' es el array de filas
        // { id, nom, categoria, horas_max }. El cliente lo cachea para
        // resolver nombres sin volver a preguntar por cada recurso.
        var { data: modelos, error } = await supabase.from("modelos").select("*");
        if (error) throw error;
        res.status(200).json(modelos);
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// PUT /api/gestores/:id - Actualiza los datos del gestor
app.put("/api/gestores/:id", async function (req, res) {
    try {
        // req.params.id = la parte variable de la URL (/api/gestores/3 -> "3").
        var id = req.params.id;
        var datosNuevos = req.body;

        // -------------------------------------------------------------
        // BLOQUE bd (1 de 3): ¿EXISTE el gestor que quieren editar?
        //  SQL: SELECT id FROM gestores WHERE id = id
        //  Si no trae filas, ese id no existe -> 404.
        // -------------------------------------------------------------
        var { data: existe, error: errorExiste } = await supabase
            .from("gestores")
            .select("id")
            .eq("id", id);
        if (errorExiste) throw errorExiste;
        if (existe.length === 0) {
            return res.status(404).json("Gestor no encontrado");
        }

        // -------------------------------------------------------------
        // BLOQUE bd (2 de 3): el login debe seguir siendo ÚNICO.
        //  SQL: SELECT id FROM gestores WHERE user = usuario AND id <> id
        //  .neq() es el "distinto de" (<>): así el propio gestor puede
        //  conservar su login sin que se detecte como duplicado consigo mismo.
        // -------------------------------------------------------------
        var usuario = datosNuevos.login || datosNuevos.user;
        var { data: duplicado, error: errorDuplicado } = await supabase
            .from("gestores")
            .select("id")
            .eq("user", usuario)
            .neq("id", id);
        if (errorDuplicado) throw errorDuplicado;
        if (duplicado.length > 0) {
            return res.status(403).json("El login ya está en uso por otro usuario");
        }

        // -------------------------------------------------------------
        // BLOQUE bd (3 de 3): UPDATE (machaca los datos viejos).
        //  SQL: UPDATE gestores SET nom, ape, user, pswd WHERE id = id
        //  MUY IMPORTANTE el .eq("id", id): sin él actualizaría TODOS.
        // -------------------------------------------------------------
        var { error } = await supabase
            .from("gestores")
            .update({
                nom: datosNuevos.nombre || datosNuevos.nom,
                ape: datosNuevos.apellidos || datosNuevos.ape,
                user: usuario,
                pswd: datosNuevos.password || datosNuevos.pswd
            })
            .eq("id", id);
        if (error) throw error;

        res.status(200).json("Gestor actualizado");
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

/*
! ---------------------------- GET GESTORES :id  -----------------------------
GET /api/gestores/:id - Datos de un gestor (SIN contraseña)
*/
app.get("/api/gestores/:id", async function (req, res) {
    try {
        // -------------------------------------------------------------
        // BLOQUE bd: SELECT de UN registro por id, SIN la contraseña.
        //  SQL: SELECT id, nom, ape, user FROM gestores WHERE id = id
        //  Solo pedimos las columnas seguras: la pswd NUNCA sale de la BD.
        // -------------------------------------------------------------
        var { data: filas, error } = await supabase
            .from("gestores")
            .select("id, nom, ape, user")
            .eq("id", req.params.id);
        if (error) throw error;
        if (filas.length === 0) {
            return res.status(404).json("Gestor no encontrado"); // no existe ese id
        }
        res.status(200).json(filas[0]); // el único gestor encontrado
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// GET /api/sanitarios/:id - Datos de un sanitario (SIN contraseña)
app.get("/api/sanitarios/:id", async function (req, res) {
    try {
        // BLOQUE bd: idéntico al de gestores, sobre la tabla sanitarios.
        // Seleccionamos solo columnas seguras (sin pswd) y devolvemos filas[0].
        var { data: filas, error } = await supabase
            .from("sanitarios")
            .select("id, nom, ape, user")
            .eq("id", req.params.id);
        if (error) throw error;
        if (filas.length === 0) {
            return res.status(404).json("Sanitario no encontrado");
        }
        res.status(200).json(filas[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// GET /api/recursos - Todos los recursos. Filtros opcionales por query string.
app.get("/api/recursos", async function (req, res) {
    try {
        // -------------------------------------------------------------
        // BLOQUE bd: SELECT con FILTROS DINÁMICOS (equivale a encadenar
        // varios .filter()). La técnica:
        //  - req.query = parámetros de la URL tras el ? (?modelo=6&estado=0).
        //  - Empezamos con la consulta sin filtros y, por cada filtro activo,
        //    le encadenamos un .eq(...). Es como ir añadiendo " AND ..." al SQL.
        //  - La consulta no se ejecuta hasta el await del final.
        // -------------------------------------------------------------
        var consulta = supabase.from("recursos").select("*");

        // Categoría: un recurso no guarda la categoría directamente (guarda
        // el modelo). En SQL era una SUBCONSULTA:
        //   modelo IN (SELECT id FROM modelos WHERE categoria = ?)
        // Con Supabase se hace en dos pasos: primero los ids de los modelos
        // de esa categoría y después .in("modelo", esosIds).
        if (req.query.categoria && req.query.categoria !== "Todos") {
            var { data: modelosCategoria, error: errorModelos } = await supabase
                .from("modelos")
                .select("id")
                .eq("categoria", req.query.categoria);
            if (errorModelos) throw errorModelos;
            var idsModelos = modelosCategoria.map(function (m) { return m.id; });
            consulta = consulta.in("modelo", idsModelos);
        }
        // Modelo (comparación directa con la columna modelo)
        if (req.query.modelo && req.query.modelo !== "Todos") {
            consulta = consulta.eq("modelo", req.query.modelo);
        }
        // Ubicación
        if (req.query.ubicacion && req.query.ubicacion !== "Todos") {
            consulta = consulta.eq("ubi", req.query.ubicacion);
        }
        // Estado ('0','1','2')
        if (req.query.estado && req.query.estado !== "Todos") {
            consulta = consulta.eq("estado", req.query.estado);
        }

        // Ejecutamos la consulta ya montada.
        var { data: resultados, error } = await consulta;
        if (error) throw error;
        res.status(200).json(resultados); // 200 y [] (array vacío) si no hay resultados
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// GET /api/recursos/:id - Datos de un recurso
app.get("/api/recursos/:id", async function (req, res) {
    try {
        // BLOQUE bd: SELECT * FROM recursos WHERE id = id (como un .find()).
        // select("*") porque aquí sí queremos todos sus campos. 0 o 1 filas.
        var { data: filas, error } = await supabase
            .from("recursos")
            .select("*")
            .eq("id", req.params.id);
        if (error) throw error;
        if (filas.length === 0) {
            return res.status(404).json("Recurso no encontrado");
        }
        res.status(200).json(filas[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// POST /api/recursos - Crea un recurso (el id lo pone la BD)
app.post("/api/recursos", async function (req, res) {
    try {
        var datos = req.body; // datos del formulario, ocultos en el cuerpo
        // -------------------------------------------------------------
        // BLOQUE bd: INSERT de un recurso (equivale a .push()).
        //  SQL: INSERT INTO recursos (modelo, ubi, num_serie, estado) VALUES (...)
        //  - No incluimos id (lo pone la BD).
        //  - "datos.ubicacion || datos.ubi": aceptamos el campo venga con el
        //    nombre que venga del cliente (tolerancia de nombres).
        //  - Si el num_serie estuviera repetido, la BD devolvería error (hay
        //    índice UNIQUE) y saltaría al catch -> 500.
        // -------------------------------------------------------------
        var { error } = await supabase
            .from("recursos")
            .insert({
                modelo: datos.modelo,
                ubi: datos.ubicacion || datos.ubi,
                num_serie: datos.num_serie || datos.numero_serie,
                estado: datos.estado
            });
        if (error) throw error;
        res.status(201).json("Recurso creado");
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// PUT /api/recursos/:id - Actualiza un recurso
app.put("/api/recursos/:id", async function (req, res) {
    try {
        var id = req.params.id;
        var datos = req.body;

        // -------------------------------------------------------------
        // BLOQUE bd (1 de 2): traer el recurso ACTUAL.
        //  Lo necesitamos por dos motivos: (a) si no existe -> 404, y
        //  (b) para conservar los valores que el cliente no haya enviado.
        // -------------------------------------------------------------
        var { data: existe, error: errorExiste } = await supabase
            .from("recursos")
            .select("*")
            .eq("id", id);
        if (errorExiste) throw errorExiste;
        if (existe.length === 0) {
            return res.status(404).json("Recurso no encontrado");
        }

        // -------------------------------------------------------------
        // BLOQUE bd (2 de 2): UPDATE del recurso.
        //  "datos.x || actual.x": si el cliente NO manda un campo, usamos el
        //  valor actual (así un PUT parcial no borra lo que no toca).
        //  El .eq("id", id) limita el UPDATE a esta fila.
        // -------------------------------------------------------------
        var actual = existe[0];
        var { error } = await supabase
            .from("recursos")
            .update({
                modelo: datos.modelo || actual.modelo,
                ubi: datos.ubicacion || datos.ubi || actual.ubi,
                num_serie: datos.num_serie || datos.numero_serie || actual.num_serie,
                estado: datos.estado || actual.estado
            })
            .eq("id", id);
        if (error) throw error;

        res.status(200).json("Recurso actualizado");
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// DELETE /api/recursos/:id - Borra un recurso
// (las reservas/reseñas asociadas caen solas por ON DELETE CASCADE de la BD)
app.delete("/api/recursos/:id", async function (req, res) {
    try {
        // -------------------------------------------------------------
        // BLOQUE bd: DELETE (equivale a .splice()).
        //  SQL: DELETE FROM recursos WHERE id = id
        //  - El .eq("id", ...) es imprescindible: sin él borraría TODA la tabla.
        //  - .select() hace que nos devuelva las filas borradas. Si no hay
        //    ninguna, ese id no existía -> 404. (En MySQL era affectedRows.)
        //  - Las reservas/reseñas de ese recurso se borran solas por el
        //    ON DELETE CASCADE definido en la BD (no hay que borrarlas aquí).
        // -------------------------------------------------------------
        var { data: borrados, error } = await supabase
            .from("recursos")
            .delete()
            .eq("id", req.params.id)
            .select();
        if (error) throw error;
        if (borrados.length === 0) {
            return res.status(404).json("Recurso no encontrado");
        }
        res.status(200).json("Recurso borrado");
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// GET /api/recursos/:id/reservas - Reservas de un recurso
app.get("/api/recursos/:id/reservas", async function (req, res) {
    try {
        // BLOQUE bd (1 de 2): comprobamos que el recurso existe (si no -> 404).
        var { data: recurso, error: errorRecurso } = await supabase
            .from("recursos")
            .select("id")
            .eq("id", req.params.id);
        if (errorRecurso) throw errorRecurso;
        if (recurso.length === 0) {
            return res.status(404).json("Recurso no encontrado");
        }
        // BLOQUE bd (2 de 2): traemos TODAS las reservas de ese recurso
        // (SELECT * FROM reservas WHERE recurso = id). 0, 1 o muchas filas.
        var { data: reservasRecurso, error } = await supabase
            .from("reservas")
            .select("*")
            .eq("recurso", req.params.id);
        if (error) throw error;

        // Las fechas se devuelven en ISO con Z, como salían con MySQL
        // (el cliente y el envío al Ministerio esperan ese formato).
        reservasRecurso.forEach(function (r) {
            r.fecha_peticion = fechaBDaTexto(r.fecha_peticion);
            r.fecha_inicio = fechaBDaTexto(r.fecha_inicio);
            r.fecha_fin = fechaBDaTexto(r.fecha_fin);
        });
        res.status(200).json(reservasRecurso);
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// GET /api/recursos/:id/resenyas - Reseñas de un recurso
app.get("/api/recursos/:id/resenyas", async function (req, res) {
    try {
        // BLOQUE bd (1 de 2): comprobamos que el recurso existe (si no -> 404).
        var { data: recurso, error: errorRecurso } = await supabase
            .from("recursos")
            .select("id")
            .eq("id", req.params.id);
        if (errorRecurso) throw errorRecurso;
        if (recurso.length === 0) {
            return res.status(404).json("Recurso no encontrado");
        }
        // BLOQUE bd (2 de 2): traemos TODAS las reseñas de ese recurso
        // (SELECT * FROM resenyas WHERE recurso = id). El cliente calcula con ellas la media.
        var { data: resenyasRecurso, error } = await supabase
            .from("resenyas")
            .select("*")
            .eq("recurso", req.params.id);
        if (error) throw error;

        // Misma normalización de fecha que en las reservas
        resenyasRecurso.forEach(function (r) {
            r.fecha = fechaBDaTexto(r.fecha);
        });
        res.status(200).json(resenyasRecurso);
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// El servidor escucha en el puerto 3000
app.listen(3000, function() {
    console.log("Servidor hospitalario ejecutándose en http://localhost:3000");
});
