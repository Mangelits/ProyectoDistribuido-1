//Es necesario instalar en la carpeta del servidor los modulos cors y express
var rpc = require("./rpc.js");
var datos = require("./datos.js");

var sanitarios = datos.sanitarios;


var express = require("express");
var appExpress = express();
appExpress.use("/cliente_rpc", express.static("cliente_rpc"));

function loginSanitario(user, password, callback) {
    var sanitarioFound = sanitarios.find(function(s) {
        return s.user === user && s.pswd === password; // Comparo s (de sanitario funcion).user , con el parametro de loginSanitario user y lo mismo con la contraseña
    });

    if (sanitarioFound) { //Significa = Si sanitadioFound es true (existe) (return anterior)
        callback(sanitarioFound.id) // el callback es su id (Que luego queremos guardar)
    } else {
        callback(null) //El callback será null, para que sirva en la funcion del main
    }
} 

var servidor = rpc.server(); // crear el servidor RPC
var app = servidor.createApp("gestion_sanitarios"); // crear aplicación de RPC

//Registramos los procedimientos | Es el segundo paso
app.registerAsync(loginSanitario);
appExpress.use(express.json());

// CORRECCIÓN 2: Usar la variable correcta 'servidor' que definiste arriba
appExpress.use(servidor.handler); 

appExpress.listen(3000, function() {
    console.log("Servidor RPC y Web iniciado en http://localhost:3000/cliente_rpc/index.html");
});



/**
 * Procedimiento en cuanto a las funciones.
 * 
 * Hago funciones en el servidor, las registro en el servidor. Y luego en el main las referenciamos para que se puedan utilizar
 * 
 */