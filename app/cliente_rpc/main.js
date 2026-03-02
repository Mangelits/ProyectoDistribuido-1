//Vinculamos cliente - servidor. Obtener una referencia a la app RPC (instancia de la aplicación gestion pacientes del servidor localhost)
var app = rpc("localhost", "gestion_pacientes"); // Vincula main con el servidor, en localhost, hay una funcion llamada gestion pacientes

//Obtener referencias a los procedimientos remotos registrados por el servidor.
var obtenerPacientes = app.procedure("obtenerPacientes"); //obtenerPacientes es una funcion 3er paso || La función definida en el servidor ahora está en el cliente
var anyadirPaciente = app.procedure("anyadirPaciente");
var eliminarPaciente = app.procedure("eliminarPaciente"); 

//Mostrar la lista de pacientes en la web (esta vale tanto para síncrono como asíncrono)
function mostrarPacientes(pacientes) {
    var lista = document.getElementById("lista"); //lista es el ul del index
    lista.innerHTML = ""; // vaciar lista por si tenía algo antes
    for (var i = 0; i < pacientes.length; i++) { 
        lista.innerHTML += "<li>" + pacientes[i].nombre + " " + pacientes[i].apellidos + " (" + pacientes[i].edad + ") <button onclick='eliminar(" + pacientes[i].id + ")'>Eliminar</button></li>";
    }
}

/* PROGRAMACIÓN ASÍNCRONA
   TODOS LOS PROCEDIMIENTOS SE LLAMAN ASÍ:
   procedimiento(argumentos, function (resultado) {
    ...
   });
   NO ES BLOQUEANTE, EL CÓDIGO DE DEBAJO CONTINUA ANTES QUE EL CALLBACK. El callback da la respuesta cuando la tenga
*/
//Función cargar la lista de pacientes. Obtiene los pacientes del serivodr
function cargar() {
    console.log("Voy a cargar los pacientes...")
    obtenerPacientes(function (pacientes) { //función asincrona del servidor llamada desde el main, es decir, va al servidor ejecuta la funcion en linea 11 y devuelve el callback para guardarlo en "pacientes"
        console.log("Voy a mostrar los datos...",pacientes)
    mostrarPacientes(pacientes);   
    });
    
    console.log("Ya he solicitado los pacientes (ahora toca esperar que se ejecute el callback)");
}

//Función para añadir un paciente nuevo
function anyadir() {
    var nombre = document.getElementById("nombre").value;
    var apellidos = document.getElementById("apellidos").value;
    var edad = document.getElementById("edad").value;
    if (edad) edad = parseInt(edad); //para que no de error al hacer parseInt de un valor nulo

    anyadirPaciente(nombre, apellidos, edad, function (id) {
        if (id == 0) {
            alert("Error al añadir un paciente");
        } else {
            console.log("Se ha añadido el paciente con id", id);
            cargar(); 
        }
    });
}

//Función para eliminar un paciente
function eliminar(id) {
    eliminarPaciente(id, function (eliminado) {
        if (eliminado) {
            cargar();
        } else {
            alert("Error. NO se ha podido eliminar ese paciente");
        }
    });
}
