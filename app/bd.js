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
//
// =====================================================================
// LOS 4 SUBLENGUAJES DE SQL: DDL, DML, DCL y TCL  (repaso teórico)
// =====================================================================
// SQL no es un solo lenguaje: sus comandos se agrupan en 4 familias
// según PARA QUÉ sirven. Saber a qué grupo pertenece cada comando ayuda
// a entender qué hace y si se puede deshacer.
//
// ---------------------------------------------------------------------
// 1) DDL — Data Definition Language (Lenguaje de DEFINICIÓN de datos)
// ---------------------------------------------------------------------
//    Define y modifica la ESTRUCTURA de la base de datos (las tablas,
//    columnas, tipos, claves...), NO los datos que hay dentro.
//    Comandos:
//      CREATE   -> crear (base de datos, tabla, índice, vista...).
//                  Ej: CREATE TABLE recursos (id INT, ...);
//      ALTER    -> modificar una estructura ya creada.
//                  Ej: ALTER TABLE recursos ADD PRIMARY KEY (id);
//      DROP     -> eliminar por completo una estructura.
//                  Ej: DROP TABLE recursos;
//      TRUNCATE -> vaciar TODA una tabla de golpe (borra sus filas pero
//                  mantiene la tabla). Ej: TRUNCATE TABLE reservas;
//      RENAME   -> renombrar una tabla.
//    NOTA: en MySQL/MariaDB el DDL hace COMMIT automático (no se puede
//          deshacer con ROLLBACK).
//    En ESTE proyecto el DDL está en el archivo Practica.sql (los
//    CREATE TABLE, ALTER TABLE...), no aquí en el código Node.
//
// ---------------------------------------------------------------------
// 2) DML — Data Manipulation Language (Lenguaje de MANIPULACIÓN de datos)
// ---------------------------------------------------------------------
//    Trabaja con los DATOS (las filas) que hay dentro de las tablas.
//    Es lo que usan REST y RPC en cada bd.query(...). Comandos:
//      SELECT -> leer/consultar filas.        (equivale a .find()/.filter())
//      INSERT -> añadir filas nuevas.         (equivale a .push())
//      UPDATE -> modificar filas existentes.  (editar un objeto)
//      DELETE -> borrar filas.                (equivale a .splice())
//    (a veces SELECT se separa como DQL, "Data Query Language").
//    Es el grupo que MÁS usamos: todos los servicios de servidor_rest.js
//    y servidor_rpc.js son consultas DML.
//
// ---------------------------------------------------------------------
// 3) DCL — Data Control Language (Lenguaje de CONTROL/permisos)
// ---------------------------------------------------------------------
//    Gestiona los PERMISOS y usuarios: quién puede hacer qué. Comandos:
//      GRANT  -> conceder privilegios a un usuario.
//                Ej: GRANT ALL PRIVILEGES ON `Practica`.* TO 'Mangel'@'localhost';
//      REVOKE -> quitar privilegios concedidos.
//    En ESTE proyecto el DCL se usó UNA vez para crear el usuario
//    'Mangel' y darle permisos sobre la base de datos Practica (fuera de
//    Node, como root en phpMyAdmin). No se ejecuta desde el código.
//
// ---------------------------------------------------------------------
// 4) TCL — Transaction Control Language (Lenguaje de TRANSACCIONES)
// ---------------------------------------------------------------------
//    Controla las TRANSACCIONES: agrupar varias operaciones DML para que
//    se confirmen TODAS o NINGUNA (atomicidad). Comandos:
//      START TRANSACTION / BEGIN -> iniciar una transacción.
//      COMMIT      -> confirmar (guardar en firme) los cambios.
//      ROLLBACK    -> deshacer los cambios desde el inicio de la transacción.
//      SAVEPOINT   -> marcar un punto intermedio al que poder volver.
//    Útil cuando varios INSERT/UPDATE deben ir juntos (o todos o ninguno).
//    En ESTE proyecto no usamos TCL de forma explícita: cada bd.query se
//    confirma sola (autocommit). Se podría añadir para operaciones que
//    tocan varias tablas y no deben quedar a medias.
//
// ---------------------------------------------------------------------
// RESUMEN RÁPIDO
//   DDL -> estructura : CREATE, ALTER, DROP, TRUNCATE, RENAME
//   DML -> datos      : SELECT, INSERT, UPDATE, DELETE   <- lo que hace este proyecto
//   DCL -> permisos   : GRANT, REVOKE
//   TCL -> transacciones: COMMIT, ROLLBACK, SAVEPOINT, START TRANSACTION
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
