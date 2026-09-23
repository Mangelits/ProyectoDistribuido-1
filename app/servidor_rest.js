// node servidor.js
var express = require("express");
var path = require("path");
var app = express();

// Antes: var datosServidor = require('./datos.js')  (arrays en memoria)
// Ahora: la conexión a la base de datos (pool con promesas).
var bd = require('./bd.js');

/*
======================================================================
 REST CON BASE DE DATOS  (para entenderlo perfectamente)
======================================================================

 ¿QUÉ ES REST AQUÍ?
   Petición -> respuesta sobre HTTP. El cliente pide algo a una URL con
   un VERBO (GET/POST/PUT/DELETE) y el servidor responde UNA vez. Lo
   monta Express. En REST piensas en URLs y verbos (en RPC, en funciones).
   Este servidor (puerto 3000) lo usa el CLIENTE GESTOR.

 FLUJO DE UNA PETICIÓN (ej. login):
   cliente_rest/main.js  --POST-->  app.post(...)  --bd.query-->  MariaDB
                                          |             busca
   callback(200, id)   <---- res.json ----+  <----- filas ------

 EL PATRÓN DE 3 CAPAS QUE SE REPITE EN TODAS LAS RUTAS:
   app.get("/api/x", async function (req, res) {   // (1) async
       try {                                         // (2) try/catch
           var [filas] = await bd.query("SELECT..."); // (3) await
           res.status(200).json(filas);
       } catch (err) {
           res.status(500).json("Error en la base de datos");
       }
   });
   (1) async  -> necesario para poder usar await dentro.
   (2) try/catch -> si la BD falla, respondemos 500 en vez de reventar.
   (3) await  -> "espera aquí a que la BD conteste y luego sigue". Node
                 NO se bloquea: atiende otras peticiones mientras tanto.
                 La línea de después del await no corre hasta tener el dato.

 EQUIVALENCIAS ARRAY (antes) -> SQL (ahora):
   .find(cond)       -> SELECT ... WHERE ...   y luego filas[0]
   .filter(cond)     -> SELECT ... WHERE ...   (el array entero)
   .push(obj)        -> INSERT INTO ...        (el id lo pone AUTO_INCREMENT)
   .findIndex+splice -> DELETE FROM ... WHERE id = ?
   modificar objeto  -> UPDATE ... SET ... WHERE id = ?

 CÓMO LEER EL RESULTADO:  var [filas] = await bd.query("SQL", [params]);
   - filas         : array de objetos (una fila = un objeto).
   - filas[0]      : el primero (o undefined). filas.length : cuántos hay.
   - resultado.insertId     : tras un INSERT, el id nuevo (NO se calcula a mano).
   - resultado.affectedRows : tras DELETE/UPDATE, cuántas filas cambió.
   - los ? son huecos que el driver rellena seguro (evita inyección SQL).

 REST vs RPC (mismo SQL, distinto "envoltorio"):
   REST responde con  res.status(...).json(...)  y códigos HTTP.
   RPC  responde con  callback(...)              y sin códigos.
======================================================================
*/

app.use("/appCliente", express.static(path.join(__dirname, "cliente_rest")));
app.use("/appSanitario", express.static(path.join(__dirname, "cliente_rpc")));
app.use(express.json());


// ======================================================================
//! ---------------------------- SERVICIOS  -----------------------------
// ======================================================================

// GET /api/ubicaciones - Todas las ubicaciones
app.get("/api/ubicaciones", async function (req, res) {
    try {
        // -------------------------------------------------------------
        // BLOQUE bd: SELECT de TODO (equivale a devolver el array entero).
        //  - "SELECT * FROM ubicaciones" pide todas las columnas (*) de
        //    todas las filas de la tabla ubicaciones. No lleva ? porque no
        //    hay ningún dato variable que filtrar.
        //  - await: pausa esta función hasta que MariaDB conteste (sin
        //    bloquear al resto del servidor).
        //  - var [ubicaciones] = ...: query devuelve [filas, metadatos];
        //    con [ubicaciones] cogemos SOLO las filas (posición 0). Aquí
        //    'ubicaciones' es un array de objetos { id, nom }.
        // -------------------------------------------------------------
        var [ubicaciones] = await bd.query("SELECT * FROM ubicaciones");
        res.status(200).json(ubicaciones); // lo enviamos tal cual al cliente
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// GET /api/categorias - Todas las categorías
app.get("/api/categorias", async function (req, res) {
    try {
        // BLOQUE bd: mismo patrón que ubicaciones. SELECT * trae todas las
        // categorías; [categorias] se queda con el array de filas { id, nom }.
        var [categorias] = await bd.query("SELECT * FROM categorias");
        res.status(200).json(categorias);
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// GET /api/modelos - Todos los modelos
app.get("/api/modelos", async function (req, res) {
    try {
        // BLOQUE bd: SELECT de todos los modelos. [modelos] es el array de
        // filas { id, nom, categoria, horas_max }. El cliente lo cachea para
        // resolver nombres sin volver a preguntar por cada recurso.
        var [modelos] = await bd.query("SELECT * FROM modelos");
        res.status(200).json(modelos);
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

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
        //  - Los dos ? son huecos que el driver rellena con [login, password]
        //    de forma segura (evita inyección SQL). El SQL final busca un
        //    gestor cuyo user Y pswd coincidan exactamente.
        //  - Devuelve 0 o 1 filas. Como puede traer "varias", el resultado
        //    es SIEMPRE un array; aquí miramos su tamaño.
        // -------------------------------------------------------------
        var [filas] = await bd.query(
            "SELECT * FROM gestores WHERE user = ? AND pswd = ?",
            [login, password]
        );

        if (filas.length > 0) {
            // filas[0] es el gestor encontrado; devolvemos solo su id.
            res.status(200).json(filas[0].id);
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
        //  Aquí hacen falta DOS consultas seguidas y la segunda depende de
        //  la primera. Con await se leen de arriba abajo: primero miramos
        //  si ya hay un gestor con ese user; SELECT id (no *) porque solo
        //  nos interesa saber si existe, no sus datos.
        // -------------------------------------------------------------
        var [existe] = await bd.query("SELECT id FROM gestores WHERE user = ?", [usernameRecibido]);
        if (existe.length > 0) {
            // Ya hay alguien con ese login -> cortamos aquí (no insertamos).
            return res.status(403).json("El login ya está en uso");
        }

        // -------------------------------------------------------------
        // BLOQUE bd (2 de 2): INSERT (equivale a .push()).
        //  - NO ponemos la columna id: lo asigna solo AUTO_INCREMENT. Por eso
        //    desaparece el antiguo "length + 1" para calcular ids a mano.
        //  - VALUES (?, ?, ?, ?) se rellenan con el array en el MISMO orden
        //    que las columnas listadas (nom, ape, user, pswd).
        //  - resultado.insertId tendría el id nuevo si lo necesitáramos.
        // -------------------------------------------------------------
        var [resultado] = await bd.query(
            "INSERT INTO gestores (nom, ape, user, pswd) VALUES (?, ?, ?, ?)",
            [
                nuevoGestor.nombre || nuevoGestor.nom,
                nuevoGestor.apellidos || nuevoGestor.ape,
                usernameRecibido,
                nuevoGestor.password || nuevoGestor.pswd
            ]
        );

        // 201: creado. Se conserva el mensaje que espera el cliente.
        res.status(201).json("Gestor registrado");
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
        //  Si el SELECT no trae filas, ese id no existe -> 404.
        // -------------------------------------------------------------
        var [existe] = await bd.query("SELECT id FROM gestores WHERE id = ?", [id]);
        if (existe.length === 0) {
            return res.status(404).json("Gestor no encontrado");
        }

        // -------------------------------------------------------------
        // BLOQUE bd (2 de 3): el login debe seguir siendo ÚNICO.
        //  Buscamos otro gestor con ese mismo user PERO con id distinto
        //  (id <> ?): así el propio gestor puede conservar su login sin que
        //  se detecte como "duplicado consigo mismo".
        // -------------------------------------------------------------
        var usuario = datosNuevos.login || datosNuevos.user;
        var [duplicado] = await bd.query(
            "SELECT id FROM gestores WHERE user = ? AND id <> ?",
            [usuario, id]
        );
        if (duplicado.length > 0) {
            return res.status(403).json("El login ya está en uso por otro usuario");
        }

        // -------------------------------------------------------------
        // BLOQUE bd (3 de 3): UPDATE (machaca los datos viejos).
        //  SET col = ? por cada campo y, MUY IMPORTANTE, el WHERE id = ? al
        //  final para tocar SOLO ese gestor (sin WHERE, actualizaría TODOS).
        //  El último ? del array (id) corresponde a ese WHERE.
        // -------------------------------------------------------------
        await bd.query(
            "UPDATE gestores SET nom = ?, ape = ?, user = ?, pswd = ? WHERE id = ?",
            [
                datosNuevos.nombre || datosNuevos.nom,
                datosNuevos.apellidos || datosNuevos.ape,
                usuario,
                datosNuevos.password || datosNuevos.pswd,
                id
            ]
        );

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
        //  En vez de "SELECT *", listamos solo las columnas seguras
        //  (id, nom, ape, user): así la pswd NUNCA sale de la BD ni viaja
        //  al cliente. Devuelve 0 o 1 filas.
        // -------------------------------------------------------------
        var [filas] = await bd.query(
            "SELECT id, nom, ape, user FROM gestores WHERE id = ?",
            [req.params.id]
        );
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
        var [filas] = await bd.query(
            "SELECT id, nom, ape, user FROM sanitarios WHERE id = ?",
            [req.params.id]
        );
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
        // varios .filter()). En vez de filtrar en JavaScript, dejamos que
        // lo haga SQL (es su especialidad). La técnica:
        //  - req.query = parámetros de la URL tras el ? (?modelo=6&estado=0).
        //  - Empezamos con "WHERE 1=1" (siempre cierto) para poder ir
        //    concatenando " AND ..." sin preocuparnos de cuál es el primero.
        //  - Por cada filtro activo añadimos un " AND col = ?" al SQL y
        //    metemos su valor en el array 'params' EN EL MISMO ORDEN. Así
        //    el nº de ? del texto y el nº de valores de params cuadran.
        // -------------------------------------------------------------
        var sql = "SELECT * FROM recursos WHERE 1=1";
        var params = [];

        // Categoría: un recurso no guarda la categoría directamente (guarda
        // el modelo), así que usamos una SUBCONSULTA: "recursos cuyo modelo
        // esté entre los modelos de esta categoría" (categoría -> modelos -> recursos).
        if (req.query.categoria && req.query.categoria !== "Todos") {
            sql += " AND modelo IN (SELECT id FROM modelos WHERE categoria = ?)";
            params.push(req.query.categoria);
        }
        // Modelo (comparación directa con la columna modelo)
        if (req.query.modelo && req.query.modelo !== "Todos") {
            sql += " AND modelo = ?";
            params.push(req.query.modelo);
        }
        // Ubicación
        if (req.query.ubicacion && req.query.ubicacion !== "Todos") {
            sql += " AND ubi = ?";
            params.push(req.query.ubicacion);
        }
        // Estado ('0','1','2')
        if (req.query.estado && req.query.estado !== "Todos") {
            sql += " AND estado = ?";
            params.push(req.query.estado);
        }

        // Ejecutamos el SQL ya montado junto con sus valores.
        var [resultados] = await bd.query(sql, params);
        res.status(200).json(resultados); // 200 y [] (array vacío) si no hay resultados
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// GET /api/recursos/:id - Datos de un recurso
app.get("/api/recursos/:id", async function (req, res) {
    try {
        // BLOQUE bd: SELECT de UN recurso por su id (como un .find()).
        // SELECT * porque aquí sí queremos todos sus campos. 0 o 1 filas.
        var [filas] = await bd.query("SELECT * FROM recursos WHERE id = ?", [req.params.id]);
        if (filas.length === 0) {
            return res.status(404).json("Recurso no encontrado");
        }
        res.status(200).json(filas[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// POST /api/recursos - Crea un recurso (el id lo pone AUTO_INCREMENT)
app.post("/api/recursos", async function (req, res) {
    try {
        var datos = req.body; // datos del formulario, ocultos en el cuerpo
        // -------------------------------------------------------------
        // BLOQUE bd: INSERT de un recurso (equivale a .push()).
        //  - No incluimos id (lo pone AUTO_INCREMENT).
        //  - "datos.ubicacion || datos.ubi": aceptamos el campo venga con el
        //    nombre que venga del cliente (tolerancia de nombres).
        //  - Si el num_serie estuviera repetido, la BD lanzaría error (hay
        //    índice UNIQUE) y saltaría al catch -> 500.
        // -------------------------------------------------------------
        await bd.query(
            "INSERT INTO recursos (modelo, ubi, num_serie, estado) VALUES (?, ?, ?, ?)",
            [
                datos.modelo,
                datos.ubicacion || datos.ubi,
                datos.num_serie || datos.numero_serie,
                datos.estado
            ]
        );
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
        var [existe] = await bd.query("SELECT * FROM recursos WHERE id = ?", [id]);
        if (existe.length === 0) {
            return res.status(404).json("Recurso no encontrado");
        }

        // -------------------------------------------------------------
        // BLOQUE bd (2 de 2): UPDATE del recurso.
        //  "datos.x || actual.x": si el cliente NO manda un campo, usamos el
        //  valor actual (así un PUT parcial no borra lo que no toca). Equivale
        //  al viejo "|| recursos[indice].x". El WHERE id = ? limita a esta fila.
        // -------------------------------------------------------------
        var actual = existe[0];
        await bd.query(
            "UPDATE recursos SET modelo = ?, ubi = ?, num_serie = ?, estado = ? WHERE id = ?",
            [
                datos.modelo || actual.modelo,
                datos.ubicacion || datos.ubi || actual.ubi,
                datos.num_serie || datos.numero_serie || actual.num_serie,
                datos.estado || actual.estado,
                id
            ]
        );

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
        //  - Borra la fila con ese id. El WHERE id = ? es imprescindible:
        //    sin él, DELETE FROM recursos borraría TODA la tabla.
        //  - resultado.affectedRows = nº de filas borradas. Si es 0, ese id
        //    no existía -> 404. Si es 1, se borró bien -> 200.
        //  - Las reservas/reseñas de ese recurso se borran solas por el
        //    ON DELETE CASCADE definido en la BD (no hay que borrarlas aquí).
        // -------------------------------------------------------------
        var [resultado] = await bd.query("DELETE FROM recursos WHERE id = ?", [req.params.id]);
        if (resultado.affectedRows === 0) {
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
        var [recurso] = await bd.query("SELECT id FROM recursos WHERE id = ?", [req.params.id]);
        if (recurso.length === 0) {
            return res.status(404).json("Recurso no encontrado");
        }
        // BLOQUE bd (2 de 2): traemos TODAS las reservas de ese recurso
        // (un .filter() por recurso). Puede devolver 0, 1 o muchas filas.
        var [reservasRecurso] = await bd.query("SELECT * FROM reservas WHERE recurso = ?", [req.params.id]);
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
        var [recurso] = await bd.query("SELECT id FROM recursos WHERE id = ?", [req.params.id]);
        if (recurso.length === 0) {
            return res.status(404).json("Recurso no encontrado");
        }
        // BLOQUE bd (2 de 2): traemos TODAS las reseñas de ese recurso
        // (un .filter() por recurso). El cliente calcula con ellas la media.
        var [resenyasRecurso] = await bd.query("SELECT * FROM resenyas WHERE recurso = ?", [req.params.id]);
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
