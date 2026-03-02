//Es necesario instalar en la carpeta del servidor los modulos cors y express

var rpc = require("./rpc.js"); //incorporamos la libreria

var datos=require("./datos.js")
var pacientes = datos.pac

var siguienteId = 2; 

//Función para obtener los pacientes
function obtenerPacientes(callback) {
    return callback(pacientes); // Equivalente en RES, al REST.STATUS.JSON
}

//Función para crear un nuevo paciente. Retorna su id o 0 si ha fallado
function anyadirPaciente(nom, ape, ed, callback) { 
    if (!nom || !ape || !ed) return callback(0); 

    var id = siguienteId; 
    siguienteId++; 
    console.log("Añadir paciente", nom, ape, ed);
    pacientes.push({ id: id, nombre: nom, apellidos: ape, edad: ed }); 
    return callback(id);
}

//Función para eliminar un paciente. Retorna true o false 
function eliminarPaciente(id, callback) {
    for (var i = 0; i<pacientes.length ; i ++) {
        if (pacientes[i].id == id) {
            pacientes.splice(i, 1);
            return callback(true); // paciente borrado
        }
    }
    return callback(false); // paciente no borrado (no encontrado)
}

var servidor = rpc.server(); // crear el servidor RPC
var app = servidor.createApp("gestion_pacientes"); // crear aplicación de RPC

//Registramos los procedimientos
app.registerAsync(obtenerPacientes); // es el segundo paso, registramos la funcion, en RPC
app.registerAsync(anyadirPaciente);
app.registerAsync(eliminarPaciente);



/**
 * Procedimiento en cuanto a las funciones.
 * 
 * Hago funciones en el servidor, las registro en el servidor. Y luego en el main las referenciamos para que se puedan utilizar
 * 
 */

