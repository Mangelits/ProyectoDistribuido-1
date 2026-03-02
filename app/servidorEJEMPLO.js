
// node servidor.js
var express = require("express");
var app = express();

var datosServidor = require('./datos.js');
var medicos=datosServidor.med
var pacientes=datosServidor.pac
console.log(medicos[0].nom);
console.log(pacientes[0].edad);

console.log();

app.use("/appCliente", express.static("cliente")); // es la parte donde dice que en la url /appCliente cargue la carpeta "cliente"
app.use(express.json()); //                                                            url es localhost:puerto/appCliente   y en la carpeta cliente carga el index html por defecto

var hospitales = [
    { id: 1, nombre: "Hospital de Alicante", provincia: "Alicante" },
    { id: 2, nombre: "Hospital de Elche", provincia: "Alicante" }
]; // []es tipo array
var siguienteHospital = 3;

app.get("/api/hospitales", function (req, res) { // primer argumento de la funcion es la pediticion y la segunda es la respuesta request y response
    res.status(200).json(hospitales); //segundo paso []status es el codigo que responde cuando va bien o mal 200 es por ejemplo que va bien
}); // los status 400 son de error por elemplo, el error 404 
// cuando ejecuto en terminal con "node servidor.js" se ejecuta y si en una web (firefox) busco http://localhost:3000/api/hospitales me mostrará lo salido


app.post("/api/hospitales", function (req, res) { //tercer paso
    console.log(req.body)
    var hosp = {
        id: siguienteHospital,
        nombre: req.body.nombre, // req.body equivale hospital
        provincia: req.body.provincia
    };
    console.log(hosp)
    hospitales.push(hosp); //push es el metodo que añade al final del array de hospitales
    siguienteHospital++; // incremento de 1 al id del hospital
    res.status(201).json("Hospital creado"); //cuarto paso el status 201 significa "Creado correctamente"
});

app.delete("/api/hospital/:idHospital", function (req, res) { //hay un parámetro en la url los : del parametro son fundamentales para indicar que el parametro es variable
    var id = req.params.idHospital;
    for (var i = 0 ; i<hospitales.length ; i++) {
        if (hospitales[i].id == id) {
            hospitales.splice(i, 1); //splice es el metodo para eliminar elemtento del array con 2 parametros, (posicion,)
            res.status(200).json("Hospital borrado"); //segundo paso
            return;
        }
    }
    res.status(404).json("No se ha encontrado el hospital a borrar");
});



app.listen(3000);