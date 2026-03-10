//Vinculamos cliente - servidor. Obtener una referencia a la app RPC (instancia de la aplicación gestion pacientes del servidor localhost)
var appRPC = rpc("localhost", "gestion_sanitarios"); // Vincula main con el servidor, en localhost, hay una funcion llamada gestion pacientes

//Obtener referencias a los procedimientos remotos registrados por el servidor //obtenerPacientes es una funcion 3er paso || La función definida en el servidor ahora está en el cliente
var loginRPC = appRPC.procedure("loginSanitario");

var idSanitarioLogueado = null;

/* PROGRAMACIÓN ASÍNCRONA
   TODOS LOS PROCEDIMIENTOS SE LLAMAN ASÍ:
   procedimiento(argumentos, function (resultado) {
    ....
   });
   NO ES BLOQUEANTE, EL CÓDIGO DE DEBAJO CONTINUA ANTES QUE EL CALLBACK. El callback da la respuesta cuando la tenga
*/

function entrar() {
    /** Consigo del html, lo que haya puesto en los campos y los guardo en unas variables*/
    var user = document.getElementById("login_user").value;
    var pswd = document.getElementById("login_password").value;
    /** Ahora llamo al servidor para que se haga el servicio 
     * ? El orden es (argumentos ...), función de respuesta (callback)*/
    rpc.loginRPC(user,pswd, function(idObtenido) {
        if (idObtenido != null) { /* Si es distinto a null, quiere decir, si el idObtenido existe, por tanto es un sanitario registrado */
            idSanitarioLogueado = idObtenido /* *Me guardo cual es el sanitario que hay logueado  */
            console.log("idLogueado existe en base de datos")

            cambiarSeccion('menu-principal');

            actualizarInicio();
        }
        else { /** Si devolvía null, significa que no se habia encontrado ningun sanitario en la lista */
            console.log("Sanitario no encontrado");
            alert("Sanitario no encontrado");
        }
    });
}

//fwfhbwejfbwefbwe