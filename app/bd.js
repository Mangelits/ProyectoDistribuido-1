// =====================================================================
// bd.js  -->  EL CIMIENTO COMÚN (sustituye a datos.js)
// =====================================================================
// Este módulo lo usan IGUAL los tres servidores (REST, RPC y WebSocket).
// Antes, datos.js exportaba ARRAYS que vivían en la RAM de Node. Ahora
// los datos viven en MariaDB (OTRO proceso, puerto 3306), así que este
// módulo NO exporta datos: exporta una CONEXIÓN para preguntarle a la BD.
//
// ---------------------------------------------------------------------
// 3 CONCEPTOS CLAVE
// ---------------------------------------------------------------------
// 1) EL POOL. Abrir una conexión a MariaDB es lento. El pool mantiene
//    varias conexiones abiertas (connectionLimit) y las va prestando:
//    escribes bd.query(...) y el pool coge una libre, la usa y la
//    devuelve. Por eso bd.js se importa UNA vez y sirve para toda la app.
//
// 2) .promise(). El driver mysql2 puede trabajar con callbacks o con
//    PROMESAS. Exportamos la versión de promesas para poder usar:
//       - await     (en REST)
//       - .then()   (en RPC)
//    Una PROMESA es un objeto que representa "un resultado que llegará
//    más tarde" (la consulta viaja por red y tarda: es ASÍNCRONA).
//
// 3) CÓMO SE LEE EL RESULTADO. Toda consulta devuelve un array de dos
//    posiciones: [filas, metadatos]. Casi siempre solo queremos las
//    filas (posición 0), por eso en todo el código verás:
//         var [filas] = await bd.query("SELECT ...");
//    Equivalencias mentales con los arrays de antes:
//         SELECT que trae varios  -> filas es el array   (como .filter())
//         SELECT de uno           -> miras filas[0]       (como .find())
//                                    y si no hay: filas.length === 0
//         INSERT                  -> resultado.insertId   (id que puso
//                                    AUTO_INCREMENT; ya NO se calcula a mano)
//         DELETE / UPDATE         -> resultado.affectedRows (filas tocadas)
//
// ---------------------------------------------------------------------
// LOS ? (CONSULTAS PREPARADAS) — MUY IMPORTANTE
// ---------------------------------------------------------------------
// NUNCA se concatena texto en el SQL. Se ponen ? como "huecos" y los
// valores van en un array aparte:
//     bd.query("SELECT * FROM gestores WHERE user = ? AND pswd = ?",
//              [login, password]);
// El driver rellena los huecos de forma SEGURA: evita la inyección SQL
// y los problemas con comillas o tildes.
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
