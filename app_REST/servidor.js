//node servidor.js
var express = require("express");
var app = express();

var datosServidor = require('./datos.js');

//* Importación correcta de cada colección
var sanitarios = datosServidor.sanitarios;
var gestores = datosServidor.gestores;
var ubicaciones = datosServidor.ubicaciones;
var categorias = datosServidor.categorias;
var modelos = datosServidor.modelos;
var recursos = datosServidor.recursos;
var reservas = datosServidor.reservas;
var resenyas = datosServidor.resenyas;

//* Comprobaciones por consola
console.log("Gestor registrado:", gestores[0].user);
console.log("Primera ubicación:", ubicaciones[0].id + " " + ubicaciones[0].nom);
console.log("N. Serie Recurso:", recursos[0].num_serie);

app.use("/appCliente", express.static("cliente")); // es la parte donde dice que en la url /appCliente cargue la carpeta "cliente"
app.use(express.json()); //                                                            url es localhost:puerto/appCliente   y en la carpeta cliente carga el index html por defecto


// --- INICIO DE SERVICIOS REST OBLIGATORIOS ---

// GET /api/ubicaciones [cite: 200]
app.get("/api/ubicaciones", function (req, res) {
    res.status(200).json(ubicaciones);
});

// GET /api/categorias [cite: 200]
app.get("/api/categorias", function (req, res) {
    res.status(200).json(categorias);
});

// GET /api/modelos [cite: 200]
app.get("/api/modelos", function (req, res) {
    res.status(200).json(modelos);
});

// El servidor escucha en el puerto 3000
app.listen(3000, function() {
    console.log("Servidor hospitalario ejecutándose en http://localhost:3000");
});


/*
!    ---- SERVICIOS ----
*/

//! LOGIN
//? Post del login
app.post("/api/login" , function(req,res) {
    // Extraigo el usuario y contraseña del body de la petición
    //              request - body - login/password
    var SentLogin = req.body.login;
    var SentPassword = req.body.password;

    // Ahora comprovamos si existe en datos [De momento SON TODO GESTORES]
    var usuarioEncontrado = gestores.find(function(encontrar) {
        return encontrar.user === SentLogin && encontrar.pswd === SentPassword;
    });

    if (usuarioEncontrado) {
        res.statusCode(200).json(usuarioEncontrado.id);
    } else {
        res.statusCode(403).json("Autentificación no es correcta. Pruebe a escribir correctamente su usuario y contraseña. O registrese si no está dado de alta en el sistema");
    }

});