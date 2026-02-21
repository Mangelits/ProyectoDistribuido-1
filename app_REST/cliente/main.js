// rest.get(url, callback)
// rest.post(url, body, callback) body es los datos que recupera del cliente
// rest.put(url, body, callback)
// rest.delete(url, callback)
// function callback(estado, respuesta) {...}

function actualizarHospitales() { // actualiza la lista de hospitales
    rest.get("/api/hospitales", function (estado, respuesta) { //primer paso el estado es el codigo status de antes
        console.log("Estado:", estado, "Hospitales:", respuesta); //tercer paso
        if (estado != 200) {
            alert("Error cargando la lista de hospitales");
            return;
        }
        var lista = document.getElementById("hospitales");
        lista.innerHTML = "";
        for (var i = 0; i < respuesta.length; i++) {
            lista.innerHTML += "<li>" + respuesta[i].id + " - " + respuesta[i].nombre + " - " + respuesta[i].provincia + " <button onclick='eliminarHospital(" + respuesta[i].id + ")'>Borrar</button></li>";
        }
    });
}

function entrar() {
    // Me creo 2 campos, para User y Password para que me recogan los valores registrados en los inputs del index.html
    var campoUser = document.getElementById("user").value;
    var campoPassword = document.getElementById("password").value;
    // Las junto, en credenciales, para que luego tambien, una vez iniciada, pueda recuperar valores
    var credenciales = {
        login: campoUser,
        password: campoPassword
    };

    // Hacemos la petición POST al servidor

    rest.post("api/login", credenciales, function(estado,respuesta) {
        //? Simple comprobación
        if (estado == 200) {
            console.log("Login correcto. Id del gestor" + respuesta);

            //* Como dije, guardo el usuario que está logeado atualmente
            usuarioActual = respuesta;

            //? Hace un llamado a la función, para que cargue el menú principal
            mostrarMenuPrincipal()

        } else if (estado == 403) {
            alert("Usuario o contraseña incorrectas")
        } else {
            alert("Error con el servidor")
        }
    });
};