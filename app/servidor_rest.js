// node servidor.js
var express = require("express");
var path = require("path");
var app = express();

// Antes: var datosServidor = require('./datos.js')  (arrays en memoria)
// Ahora: la conexión a la base de datos (pool con promesas).
var bd = require('./bd.js');

/*
======================================================================
 DE ARRAYS EN MEMORIA A CONSULTAS SQL
======================================================================
 Equivalencias mentales:
   .find(cond)      -> SELECT ... WHERE ...   y luego filas[0]
   .filter(cond)    -> SELECT ... WHERE ...   (el array entero)
   .push(obj)       -> INSERT INTO ...        (el id lo pone AUTO_INCREMENT)
   .findIndex+splice-> DELETE FROM ... WHERE id = ?
   modificar objeto -> UPDATE ... SET ... WHERE id = ?

 Con la versión de promesas del driver:
   var [filas] = await bd.query("SELECT ...", [param1, param2]);
   - filas es un array de objetos (una fila = un objeto).
   - los ? son "huecos" que el driver rellena de forma segura
     (evita inyección SQL). NUNCA se concatenan strings en el SQL.
   - en un INSERT, el resultado trae .insertId (el id generado).

 Todas las rutas son async (para poder usar await) y van dentro de un
 try/catch: si la base de datos falla, respondemos 500 en vez de que
 se caiga el servidor.
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
        var [ubicaciones] = await bd.query("SELECT * FROM ubicaciones");
        res.status(200).json(ubicaciones);
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// GET /api/categorias - Todas las categorías
app.get("/api/categorias", async function (req, res) {
    try {
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
        var login = req.body.login;
        var password = req.body.password;

        // .find() -> SELECT ... WHERE ... : devuelve 0 o 1 filas
        var [filas] = await bd.query(
            "SELECT * FROM gestores WHERE user = ? AND pswd = ?",
            [login, password]
        );

        if (filas.length > 0) {
            res.status(200).json(filas[0].id); // id del gestor
        } else {
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

        // El login tiene que ser único
        var [existe] = await bd.query("SELECT id FROM gestores WHERE user = ?", [usernameRecibido]);
        if (existe.length > 0) {
            return res.status(403).json("El login ya está en uso");
        }

        // INSERT sin id: lo asigna AUTO_INCREMENT
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
        var id = req.params.id;
        var datosNuevos = req.body;

        // Comprobar que existe
        var [existe] = await bd.query("SELECT id FROM gestores WHERE id = ?", [id]);
        if (existe.length === 0) {
            return res.status(404).json("Gestor no encontrado");
        }

        // El login tiene que ser único (pero el propio gestor puede mantener el suyo)
        var usuario = datosNuevos.login || datosNuevos.user;
        var [duplicado] = await bd.query(
            "SELECT id FROM gestores WHERE user = ? AND id <> ?",
            [usuario, id]
        );
        if (duplicado.length > 0) {
            return res.status(403).json("El login ya está en uso por otro usuario");
        }

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
        // Seleccionamos solo las columnas seguras (nunca pswd)
        var [filas] = await bd.query(
            "SELECT id, nom, ape, user FROM gestores WHERE id = ?",
            [req.params.id]
        );
        if (filas.length === 0) {
            return res.status(404).json("Gestor no encontrado");
        }
        res.status(200).json(filas[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// GET /api/sanitarios/:id - Datos de un sanitario (SIN contraseña)
app.get("/api/sanitarios/:id", async function (req, res) {
    try {
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
        // Construimos el WHERE dinámicamente. "1=1" permite ir añadiendo AND
        // sin preocuparnos de si es el primer filtro o no.
        var sql = "SELECT * FROM recursos WHERE 1=1";
        var params = [];

        // Categoría: subconsulta categoría -> modelos -> recursos
        if (req.query.categoria && req.query.categoria !== "Todos") {
            sql += " AND modelo IN (SELECT id FROM modelos WHERE categoria = ?)";
            params.push(req.query.categoria);
        }
        // Modelo
        if (req.query.modelo && req.query.modelo !== "Todos") {
            sql += " AND modelo = ?";
            params.push(req.query.modelo);
        }
        // Ubicación
        if (req.query.ubicacion && req.query.ubicacion !== "Todos") {
            sql += " AND ubi = ?";
            params.push(req.query.ubicacion);
        }
        // Estado
        if (req.query.estado && req.query.estado !== "Todos") {
            sql += " AND estado = ?";
            params.push(req.query.estado);
        }

        var [resultados] = await bd.query(sql, params);
        res.status(200).json(resultados); // 200 y [] si no hay resultados
    } catch (err) {
        console.error(err);
        res.status(500).json("Error en la base de datos");
    }
});

// GET /api/recursos/:id - Datos de un recurso
app.get("/api/recursos/:id", async function (req, res) {
    try {
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
        var datos = req.body;
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

        var [existe] = await bd.query("SELECT * FROM recursos WHERE id = ?", [id]);
        if (existe.length === 0) {
            return res.status(404).json("Recurso no encontrado");
        }

        // COALESCE(?, columna): si el parámetro llega null/undefined, mantiene
        // el valor que ya había (equivale al "|| recursos[indice].x" de antes).
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
        var [recurso] = await bd.query("SELECT id FROM recursos WHERE id = ?", [req.params.id]);
        if (recurso.length === 0) {
            return res.status(404).json("Recurso no encontrado");
        }
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
        var [recurso] = await bd.query("SELECT id FROM recursos WHERE id = ?", [req.params.id]);
        if (recurso.length === 0) {
            return res.status(404).json("Recurso no encontrado");
        }
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
