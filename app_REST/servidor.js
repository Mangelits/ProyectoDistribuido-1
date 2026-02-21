
// node servidor.js
var express = require("express");
var app = express();

var datosServidor = require('./datos.js');
var sanitarios = datosServidor.sanitarios
var gestores = datosServidor.gestores
var ubicaciones = datosServidor.ubicaciones
var categorias = datosServidor.categorias
var modelos = datosServidor.modelos
var resursos = datosServidor.resursos
var reservas = datosServidor.resenyas
var resenyas = datosServidor.resenyas
console.log(medicos[0].nom);
console.log(pacientes[0].edad);
console.log(gestores[0].user);
console.log(ubicaciones[0].id + ubicaciones[0].nom);
console.log(recursos[0].num_serie);

app.use("/appCliente", express.static("cliente")); // es la parte donde dice que en la url /appCliente cargue la carpeta "cliente"
app.use(express.json()); //                                                            url es localhost:puerto/appCliente   y en la carpeta cliente carga el index html por defecto

