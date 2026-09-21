// bd.js  --> sustituye conceptualmente a datos.js
var mysql = require('mysql2');

// Creamos el POOL una sola vez para toda la aplicación.
var pool = mysql.createPool({
    host: 'localhost',
    user: 'Mangel',
    password: 'MiguelA.128',
    database: 'Practica',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10
});

// Exportamos la versión "con promesas" para poder usar async/await,
// que es MUCHO más limpio que los callbacks anidados.
module.exports = pool.promise();