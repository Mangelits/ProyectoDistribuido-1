// =====================================================================
// bd.js  -->  SUSTITUYE a datos.js
// =====================================================================
// Antes, datos.js exportaba ARRAYS que vivían en la RAM de Node.
// Ahora los datos viven en MariaDB (otro proceso, puerto 3306), así que
// este módulo NO exporta datos: exporta una CONEXIÓN (un "pool") para
// poder preguntarle a la base de datos desde REST, RPC y WebSockets.
//
// - Un POOL es un conjunto de conexiones ya abiertas y reutilizables.
//   Abrir una conexión es caro; con el pool Node coge una prestada,
//   hace la consulta y la devuelve. El límite lo marca connectionLimit.
//
// - Exportamos pool.promise() para poder usar async/await y .then(),
//   mucho más limpio que los callbacks del driver.
// =====================================================================

var mysql = require('mysql2');

var pool = mysql.createPool({
    host: 'localhost',
    user: 'Mangel',          // usuario con privilegios sobre la BD
    password: 'MiguelA.128',  // su contraseña
    database: 'Practica',     // la base de datos a usar
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Versión con promesas -> permite: var [filas] = await bd.query(...)
module.exports = pool.promise();
