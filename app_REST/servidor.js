// node servidor.js
var express = require("express");
var app = express();

var datosServidor = require('./datos.js');

/* 
.find(condicion): Te devuelve el primer objeto entero que cumpla la condición. (Buscar por ID).

.findIndex(condicion): Te devuelve el número de posición en el array. (Imprescindible para saber en qué hueco hacer un PUT o un DELETE).

.filter(condicion): Te devuelve un array nuevo (con varios, uno o cero objetos) que cumplen la condición. (Ideal para buscadores o listar reseñas de un producto concreto).

.push(objeto): Inserta un objeto al final del array. (El equivalente a CREATE/INSERT).

.splice(posicion, cantidad): Elimina elementos del array original desde una posición concreta. (El equivalente a DELETE).
*/

// ======================================================================
//! ---------------------------- METODOS  -----------------------------
// ======================================================================
/*
    !GET (Leer / Pedir)
        ?Qué hace: 
            Solo pide datos. Va al servidor, mira lo que hay y se lo trae de vuelta. No modifica absolutamente nada. 
            Los datos que le mandas al servidor viajan a la vista de todos en la URL.
        ?Cuándo usarlo: 
            Cuando quieras obtener información
    !POST (Crear / Enviar oculto)
        ?Qué hace: 
            Envía un paquete de datos nuevos al servidor. Estos datos viajan "escondidos" en el cuerpo de la petición (req.body), no en la URL.
        ?Cuándo usarlo: Dos cosas principales:
            Para CREAR algo nuevo desde cero: 
                Como registrar un gestor nuevo o dar de alta un recurso que no existía.
            Para hacer LOGIN: 
                Como envías contraseñas, no puedes usar un GET (se vería la contraseña en la URL). Usas POST para enviarla oculta por el body.
    !PUT (Actualizar / Modificar)
        ?Qué hace: 
            Le dice al servidor: "Oye, coge este elemento que ya existe y machaca sus datos viejos con estos datos nuevos".
        ?Cuándo usarlo: 
            Siempre que quieras EDITAR algo.

    !DELETE (Borrar)
*/

//* Importación correcta de cada colección [cite: 17, 18]
var sanitarios = datosServidor.sanitarios;
var gestores = datosServidor.gestores;
var ubicaciones = datosServidor.ubicaciones;
var categorias = datosServidor.categorias;
var modelos = datosServidor.modelos;
var recursos = datosServidor.recursos;
var reservas = datosServidor.reservas;
var resenyas = datosServidor.resenyas;

app.use("/appCliente", express.static("cliente")); 
app.use(express.json()); 


// ======================================================================
//! ---------------------------- SERVICIOS  -----------------------------
// ======================================================================

// GET /api/ubicaciones - Obtenemos el array con todas las ubicaciones [cite: 200]
app.get("/api/ubicaciones", function (req, res) {
    res.status(200).json(ubicaciones);
});

// GET /api/categorias - Obtenemos el array con todas las categorías [cite: 200]
app.get("/api/categorias", function (req, res) {
    res.status(200).json(categorias);
});

// GET /api/modelos - Obtenemos el array con todos los modelos [cite: 200]
app.get("/api/modelos", function (req, res) {
    res.status(200).json(modelos);
});
/*
! ---------------------------- LOGIN  -----------------------------
POST /api/gestores/login - Realiza un login para gestor [cite: 200]
*/
app.post("/api/gestores/login", function (req, res) {
    //? Capturo el login y la contraseña que nos envía el cliente
    var login = req.body.login;
    var password = req.body.password;

    //* Busco en el array de gestores un objeto que tenga el mismo login y contraseña que nos ha enviado el cliente
    var gestor = gestores.find(g => g.user === login && g.pswd === password); //? Si no encuentra ninguno, gestor será undefined (falsy). Si encuentra uno, gestor será ese objeto (truthy).

    if (gestor) {
        // Si va bien se obtiene el id del gestor [cite: 200]
        res.status(200).json(gestor.id); 
    } else {
        // 403: Si la autenticación no es correcta [cite: 209]
        res.status(403).json("Login incorrecto"); 
    }
});

/*
! ---------------------------- REGISTRO  -----------------------------
POST /api/gestores - Crea un nuevo gestor (registro)
*/
app.post("/api/gestores", function (req, res) {
    var nuevoGestor = req.body; //? Capturo el objeto que me envía el cliente con los datos del nuevo gestor
    
    // Capturamos el usuario ya sea que venga como 'login' (desde main.js) o como 'user'
    var usernameRecibido = nuevoGestor.login || nuevoGestor.user;
    
    // El login tiene que ser único
    var existeGestor = gestores.find(g => g.user === usernameRecibido);
    if (existeGestor) {
        return res.status(403).json("El login ya está en uso");
    }

    var nuevoId = (gestores.length + 1).toString(); //? Genero el id secuencialmente (1, 2, 3...). Y lo paso a string xq en datos son strings
    var gestorParaGuardar = { //? Nuevo objeto para pushear al array de gestores, con el formato que necesitan los objetos de ese array
        id: nuevoId, 
        nom: nuevoGestor.nombre || nuevoGestor.nom,
        ape: nuevoGestor.apellidos || nuevoGestor.ape,
        user: usernameRecibido,
        pswd: nuevoGestor.password || nuevoGestor.pswd
    };

    gestores.push(gestorParaGuardar);
    res.status(201).json("Gestor registrado"); // 201: Si ha creado correctamente [cite: 206]
});

// PUT /api/gestores/:id - Actualiza los datos del gestor [cite: 203]
app.put("/api/gestores/:id", function (req, res) {
    var id = req.params.id; 
    var datosNuevos = req.body;

    var indice = gestores.findIndex(g => g.id === id);
    if (indice === -1) {
        return res.status(404).json("Gestor no encontrado"); // 404: Elemento no existe [cite: 207]
    }

    // El login tiene que ser único [cite: 203]
    var loginDuplicado = gestores.find(g => g.user === (datosNuevos.user || datosNuevos.login) && g.id !== id);
    if (loginDuplicado) {
        return res.status(403).json("El login ya está en uso por otro usuario");
    }

    gestores[indice].nom = datosNuevos.nombre || datosNuevos.nom;
    gestores[indice].ape = datosNuevos.apellidos || datosNuevos.ape;
    gestores[indice].user = datosNuevos.login || datosNuevos.user;
    gestores[indice].pswd = datosNuevos.password || datosNuevos.pswd;

    res.status(200).json("Gestor actualizado");
});
/*
! ---------------------------- GET GESTORES :id  -----------------------------
GET /api/gestores/:id - Obtiene un objeto con los datos de un gestor (no devolver contraseña) [cite: 203]
? GET http://localhost:3000/api/gestores/3
?Express ve el 3 al final de la URL.
?Como la ruta dice :id, Express dice: "Vale, el id es 3".
?Y hace que req.params.id sea igual a "3".

*/
app.get("/api/gestores/:id", function (req, res) { 
    var gestor = gestores.find(g => g.id === req.params.id); //? Busco el gestor con el ID que me han pedido en la URL
    if (!gestor) { //? Si no encuentra ningún gestor con ese ID, devuelve 404
        return res.status(404).json("Gestor no encontrado");
    }
    
    //? Devolvemos una copia sin la contraseña (por seguridad, para que no se vea ni viaje al cliente) [cite: 203]
    var gestorSeguro = { id: gestor.id, nom: gestor.nom, ape: gestor.ape, user: gestor.user };
    res.status(200).json(gestorSeguro);
});

// GET /api/sanitarios/:id - Obtiene datos de un sanitario (no devolver código de acceso/contraseña) [cite: 203]
app.get("/api/sanitarios/:id", function (req, res) {
    var sanitario = sanitarios.find(s => s.id === req.params.id);
    if (!sanitario) {
        return res.status(404).json("Sanitario no encontrado");
    }
    
    var sanitarioSeguro = { id: sanitario.id, nom: sanitario.nom, ape: sanitario.ape, user: sanitario.user };
    res.status(200).json(sanitarioSeguro);
});

// GET /api/recursos - Obtiene todos los recursos. Opcionalmente se filtra [cite: 203]
app.get("/api/recursos", function (req, res) {
    var resultados = recursos;

    // Filtrar por categoría (buscando primero los modelos de esa categoría) [cite: 203]
    if (req.query.categoria && req.query.categoria !== "Todos") {
        var modelosDeCategoria = modelos.filter(m => m.categoria === req.query.categoria).map(m => m.id);
        resultados = resultados.filter(r => modelosDeCategoria.includes(r.modelo));
    }

    // Filtrar por modelo [cite: 203]
    if (req.query.modelo && req.query.modelo !== "Todos") {
        resultados = resultados.filter(r => r.modelo === req.query.modelo);
    }

    // Filtrar por ubicación [cite: 203]
    if (req.query.ubicacion && req.query.ubicacion !== "Todos") {
        resultados = resultados.filter(r => r.ubi === req.query.ubicacion);
    }

    // Filtrar por estado [cite: 203]
    if (req.query.estado && req.query.estado !== "Todos") {
        resultados = resultados.filter(r => r.estado === req.query.estado);
    }

    // 200 y array vacío si no hay resultados en listados [cite: 208]
    res.status(200).json(resultados);
});

// GET /api/recursos/:id - Obtiene los datos de un recurso [cite: 203]
app.get("/api/recursos/:id", function (req, res) {
    var recurso = recursos.find(r => r.id === req.params.id);
    if (!recurso) {
        return res.status(404).json("Recurso no encontrado");
    }
    res.status(200).json(recurso);
});

// POST /api/recursos - Crea un recurso [cite: 203]
app.post("/api/recursos", function (req, res) {
    var datosRecurso = req.body;
    
    // Generar un nuevo ID con el formato R + 3 dígitos (ej. R011)
    var numId = recursos.length + 1;
    var nuevoId = "R" + numId.toString().padStart(3, '0');

    var nuevoRecurso = {
        id: nuevoId,
        modelo: datosRecurso.modelo,
        ubi: datosRecurso.ubicacion || datosRecurso.ubi,
        num_serie: datosRecurso.num_serie || datosRecurso.numero_serie,
        estado: datosRecurso.estado
    };

    recursos.push(nuevoRecurso);
    res.status(201).json("Recurso creado"); // 201 Created [cite: 206]
});

// PUT /api/recursos/:id - Actualiza un recurso [cite: 203]
app.put("/api/recursos/:id", function (req, res) {
    var id = req.params.id;
    var datos = req.body;

    var indice = recursos.findIndex(r => r.id === id);
    if (indice === -1) {
        return res.status(404).json("Recurso no encontrado");
    }

    recursos[indice].modelo = datos.modelo || recursos[indice].modelo;
    recursos[indice].ubi = datos.ubicacion || datos.ubi || recursos[indice].ubi;
    recursos[indice].num_serie = datos.num_serie || datos.numero_serie || recursos[indice].num_serie;
    recursos[indice].estado = datos.estado || recursos[indice].estado;

    res.status(200).json("Recurso actualizado");
});

// DELETE /api/recursos/:id - Borra un recurso [cite: 203]
app.delete("/api/recursos/:id", function (req, res) {
    var indice = recursos.findIndex(r => r.id === req.params.id);
    if (indice === -1) {
        return res.status(404).json("Recurso no encontrado");
    }
    
    recursos.splice(indice, 1);
    res.status(200).json("Recurso borrado");
});

// GET /api/recursos/:id/reservas - Obtiene las reservas de un recurso [cite: 203]
app.get("/api/recursos/:id/reservas", function (req, res) {
    var recurso = recursos.find(r => r.id === req.params.id);
    if (!recurso) {
        return res.status(404).json("Recurso no encontrado");
    }

    var reservasRecurso = reservas.filter(r => r.recurso === req.params.id);
    res.status(200).json(reservasRecurso);
});

// GET /api/recursos/:id/resenyas - Obtiene las reseñas de un recurso [cite: 203]
app.get("/api/recursos/:id/resenyas", function (req, res) {
    var recurso = recursos.find(r => r.id === req.params.id);
    if (!recurso) {
        return res.status(404).json("Recurso no encontrado");
    }

    var resenyasRecurso = resenyas.filter(r => r.recurso === req.params.id);
    res.status(200).json(resenyasRecurso);
});

// El servidor escucha en el puerto 3000
app.listen(3000, function() {
    console.log("Servidor hospitalario ejecutándose en http://localhost:3000");
});