// =====================================================================
// SERVIDOR WEBSOCKETS - Parte 3: Sistema de Avisos
// Puerto: 3502
// =====================================================================
//
// =====================================================================
// ¿QUÉ ES UN WEBSOCKET? (resumen para el examen)
// =====================================================================
// - WebSocket es un PROTOCOLO de comunicación bidireccional y persistente.
//   Una vez establecida la conexión, el cliente Y el servidor pueden
//   enviarse mensajes en cualquier dirección y en cualquier momento.
//
// - Se monta SOBRE TCP, pero la conexión empieza con un "handshake"
//   HTTP: el cliente manda un GET con la cabecera "Upgrade: websocket"
//   y el servidor responde 101 Switching Protocols. A partir de ahí la
//   misma conexión TCP deja de hablar HTTP y empieza a hablar WS.
//
// - Diferencia clave con REST / RPC:
//     * REST/RPC: petición -> respuesta. El cliente PIDE y el servidor
//       contesta una sola vez. El servidor NO puede empezar una
//       conversación por su cuenta.
//     * WS: conexión persistente, full-duplex. El servidor SÍ puede
//       enviar (push) mensajes al cliente sin que este los pida. Es lo
//       que permite los "avisos en tiempo real" que monta este archivo.
//
// - Por qué WS y no "polling" (preguntar cada X segundos por REST):
//     * Menos latencia (el mensaje llega cuando ocurre el evento).
//     * Menos tráfico (no abrimos miles de peticiones HTTP cortas).
//     * Una sola conexión TCP por cliente, en vez de una por sondeo.
//
// =====================================================================
// LIBRERÍA 'ws' DE NODE
// =====================================================================
// - El módulo 'ws' implementa el protocolo en Node.
// - WebSocket.Server({ port }) crea el servidor y abre el puerto.
// - Por cada cliente que conecta, emite el evento 'connection' con un
//   objeto ws que representa esa conexión concreta.
// - Sobre ese ws escuchamos: 'message', 'close' y 'error'.
// - Para enviar usamos ws.send(string). El protocolo permite frames
//   de texto o binarios; aquí siempre serializamos a JSON (string).
//
// readyState de un WebSocket (constantes de la API):
//     CONNECTING = 0   (handshake en curso)
//     OPEN       = 1   (listo para enviar / recibir)
//     CLOSING    = 2   (cerrándose)
//     CLOSED     = 3   (ya cerrado)
//   Solo se debe enviar cuando está en OPEN; si no, lanza error o
//   se pierde el mensaje. Por eso antes de cada .send() comprobamos
//   c.ws.readyState === WebSocket.OPEN.
//
// =====================================================================
// PATRÓN QUE USA ESTE SERVIDOR  (register + notify -> fan-out)
// =====================================================================
// 1) El cliente abre la conexión y, NADA MÁS abrirse, manda un mensaje
//    de tipo 'register' diciendo quién es:
//        { action: 'register', tipo: 'sanitario'|'gestor', id: '3' }
//    El servidor guarda en su lista interna ese cliente con su tipo+id.
//
// 2) Cuando algo relevante ocurre en el cliente (retira un recurso,
//    devuelve, crea reseña, da de alta un recurso nuevo, ...), el
//    cliente manda un mensaje 'notificar' con los datos del evento.
//
// 3) El servidor recibe la notificación y, según el TIPO, decide a
//    QUIÉN se la reenvía:
//        - recurso  -> a TODOS los sanitarios     (color azul)
//        - reserva  -> a los sanitarios con reserva no finalizada
//                      sobre ese recurso          (color rojo)
//        - resenya  -> a TODOS los gestores       (color verde)
//
// Es un esquema parecido a publish/subscribe simplificado: cada cliente
// se "suscribe" implícitamente a una categoría (sanitario o gestor) al
// registrarse, y el servidor hace de "broker" decidiendo el destino.
//
// =====================================================================
// FLUJO TEMPORAL DE UNA SESIÓN (ORDEN DE LAS COSAS) — ejemplo sanitario
// =====================================================================
//   t0  El servidor arranca: WebSocket.Server({ port: 3502 })
//   t1  El sanitario hace login (por RPC) y al terminar abre el WS:
//         new WebSocket('ws://localhost:3502')
//   t2  Handshake HTTP Upgrade -> 101 Switching Protocols.
//       En el SERVIDOR salta 'connection' (creamos el objeto cliente
//       y lo guardamos con tipo=null, id=null).
//       En el CLIENTE salta 'onopen'.
//   t3  El cliente envía el 'register' con su tipo e id. El servidor
//       lo recibe en 'message', detecta action==='register' y rellena
//       cliente.tipo y cliente.id.
//   t4  El sanitario retira un recurso. El cliente manda
//       { action:'notificar', tipo:'reserva', accion:'INICIADO', ... }.
//       Salta 'message' en el servidor, va a procesarNotificacion().
//   t5  procesarNotificacion calcula los destinatarios y hace .send()
//       a cada cliente con readyState OPEN que cumpla la condición.
//   t6  Esos clientes reciben el aviso por su 'onmessage' y lo pintan
//       en la tabla de avisos.
//   t7  El sanitario cierra sesión / cierra pestaña. Salta 'close' en
//       el servidor; lo quitamos del array para no enviarle más nada.
//
// =====================================================================
// CONTRATO DE MENSAJES (siempre JSON sobre WS)
// =====================================================================
//   Cliente -> Servidor:
//     { action: 'register', tipo: 'sanitario'|'gestor', id: '...' }
//     { action: 'notificar', tipo: 'reserva'|'recurso'|'resenya',
//       accion?: 'INICIADO'|'FINALIZADO',     // solo si tipo='reserva'
//       idRecurso, idSanitario?, origen,
//       nombreCategoria, nombreModelo, numSerie, puntuacion? }
//
//   Servidor -> Cliente (aviso a pintar):
//     { color: 'azul'|'rojo'|'verde', fecha, origen, texto }
//
// El JSON es solo CONVENCIÓN nuestra: WS transporta strings. Si no
// pusiéramos JSON.stringify / JSON.parse, los mensajes seguirían
// llegando, pero como texto plano.
// =====================================================================


var WebSocket = require('ws');             // Librería de WebSockets para Node.
var datos     = require('./datos.js');     // Acceso al array de reservas (compartido en memoria con REST/RPC).

// ---------------------------------------------------------------------
// ESTADO EN MEMORIA: lista de clientes conectados al servidor WS.
// Cada elemento: { ws, tipo: 'sanitario'|'gestor', id: '...' }
//   - ws    -> la conexión WebSocket concreta (objeto del módulo 'ws').
//   - tipo  -> rol del cliente, se rellena al recibir 'register'.
//   - id    -> id del sanitario / gestor, se rellena al recibir 'register'.
// IMPORTANTE: tipo e id están a null hasta que llegue el 'register'.
// Si alguien intentara mandar 'notificar' antes de registrarse, lo
// procesaríamos igual, pero no podría ser destinatario de nada porque
// no aparecería en los filtros (tipo === 'sanitario' / 'gestor').
// ---------------------------------------------------------------------
var clientes = [];

function iniciarWS(puerto) {
    puerto = puerto || 3502;

    // ----------------------------------------------------------------
    // ARRANCAR EL SERVIDOR WS
    // ----------------------------------------------------------------
    // WebSocket.Server abre un servidor TCP en el puerto indicado y
    // queda a la espera de handshakes WS. NO comparte puerto con REST
    // (3000) ni con RPC; usa el 3502 propio. También se podría adjuntar
    // a un servidor HTTP existente con la opción { server: httpServer },
    // pero aquí lo dejamos independiente.
    var wss = new WebSocket.Server({ port: puerto });

    // ----------------------------------------------------------------
    // EVENTO 'connection': salta UNA VEZ por cada cliente que conecta.
    // El parámetro ws es el objeto que representa ESA conexión concreta.
    // Cada cliente tiene su propio ws; el servidor mantiene N a la vez.
    // ----------------------------------------------------------------
    wss.on('connection', function(ws) {

        // Creamos la "ficha" del cliente y la metemos en la lista global.
        // Aún no sabemos quién es: el tipo/id llegarán en el 'register'.
        var cliente = { ws: ws, tipo: null, id: null };
        clientes.push(cliente);

        // ------------------------------------------------------------
        // EVENTO 'message': llega cada vez que ESTE cliente envía algo.
        // data viene como Buffer/string; lo parseamos como JSON porque
        // así lo hemos convenido (es nuestro "protocolo de aplicación"
        // por encima del WS).
        // ------------------------------------------------------------
        ws.on('message', function(data) {
            try {
                var msg = JSON.parse(data);

                // ---- REGISTRO: el cliente indica quién es ----
                // Es lo PRIMERO que manda el cliente tras abrir el WS.
                // Sin este paso el servidor sabe que "hay alguien
                // conectado" pero no sabe a qué grupo (sanitario/gestor)
                // pertenece, así que no podría dirigirle ningún aviso.
                if (msg.action === 'register') {
                    cliente.tipo = msg.tipo;   // 'sanitario' o 'gestor'
                    cliente.id   = msg.id;     // id del usuario (string)
                    console.log('[WS] Registrado:', cliente.tipo, cliente.id);
                }

                // ---- NOTIFICACIÓN: el cliente anuncia un evento ----
                // Lo delegamos en procesarNotificacion(), que decide a
                // quién hay que reenviarlo según msg.tipo.
                else if (msg.action === 'notificar') {
                    procesarNotificacion(msg);
                }

                // Cualquier otro action se ignora silenciosamente.
                // En un servidor real responderíamos con un error.

            } catch (e) {
                // JSON malformado o cualquier otro problema -> log y
                // NO tirar el servidor. Una conexión WS rota no debe
                // arrastrar a las demás.
                console.error('[WS] Error al parsear mensaje:', e.message);
            }
        });

        // ------------------------------------------------------------
        // EVENTO 'close': el cliente se ha desconectado (logout, cierre
        // de pestaña, pérdida de red, recarga de página, ...).
        // Lo quitamos del array para:
        //   1) no dejar memoria colgando (memory leak).
        //   2) no intentar enviarle .send() después: aunque chequeamos
        //      readyState, lo limpio antes para no llevar zombies.
        // ------------------------------------------------------------
        ws.on('close', function() {
            clientes = clientes.filter(function(c) { return c !== cliente; });
            console.log('[WS] Cliente desconectado:', cliente.tipo, cliente.id);
        });

        // ------------------------------------------------------------
        // EVENTO 'error': error de socket (timeout, reset, etc.).
        // Solo lo logueamos. Tras un 'error' suele venir un 'close',
        // así que la limpieza la hace el handler de 'close'.
        // ------------------------------------------------------------
        ws.on('error', function(err) {
            console.error('[WS] Error en cliente:', err.message);
        });
    });

    console.log('Servidor WebSocket escuchando en puerto ' + puerto);
}

// =====================================================================
// PROCESADO DE NOTIFICACIONES (fan-out a destinatarios)
// =====================================================================
// Esta función decide A QUIÉN se reenvía cada aviso según msg.tipo.
// Tres tipos de aviso:
//   - 'recurso' (AZUL): el gestor ha dado de alta un recurso nuevo
//        -> aviso a TODOS los sanitarios (broadcast filtrado).
//   - 'reserva' (ROJO): un sanitario ha retirado/devuelto un recurso
//        -> aviso a los sanitarios que tienen alguna reserva NO
//           finalizada sobre ese mismo recurso (multicast selectivo)
//           + al propio sanitario que disparó la acción.
//   - 'resenya' (VERDE): un sanitario ha creado una reseña
//        -> aviso a TODOS los gestores (broadcast filtrado).
//
// En cada caso:
//   1) Componemos el TEXTO del aviso (UPPERCASE para resaltar en la UI).
//   2) Lo serializamos a JSON una sola vez (eficiencia: un .stringify,
//      muchos .send).
//   3) Recorremos la lista de clientes y enviamos SOLO a los que
//      cumplen la condición Y tienen su WS en estado OPEN.
// =====================================================================
function procesarNotificacion(msg) {
    var ahora   = new Date().toLocaleString('es-ES');
    var origen  = msg.origen || 'Desconocido';

    // -----------------------------------------------------------------
    // TIPO 1 (AZUL): NUEVO RECURSO -> avisar a TODOS los sanitarios
    // Caso de uso: el gestor da de alta un recurso. El servidor avisa
    // a todos los sanitarios conectados para que puedan ir a reservarlo.
    // -----------------------------------------------------------------
    if (msg.tipo === 'recurso') {
        var texto = 'SE HA CREADO UN NUEVO RECURSO ' +
            msg.nombreCategoria.toUpperCase() + ' MODELO ' +
            msg.nombreModelo.toUpperCase() + ' CON CÓDIGO ' + msg.numSerie;

        // Serializamos UNA sola vez; reutilizamos el string en cada send.
        var aviso = JSON.stringify({ color: 'azul', fecha: ahora, origen: origen, texto: texto });

        // Recorremos la lista de clientes conectados y mandamos solo
        // a los sanitarios cuyo socket está OPEN.
        clientes.forEach(function(c) {
            if (c.tipo === 'sanitario' && c.ws.readyState === WebSocket.OPEN) {
                c.ws.send(aviso);
            }
        });

        console.log('[WS] Aviso recurso enviado a', contarTipo('sanitario'), 'sanitarios');
    }

    // -----------------------------------------------------------------
    // TIPO 2 (ROJO): ACCIÓN SOBRE RESERVA -> sanitarios afectados
    // Caso de uso: un sanitario retira (INICIADO) o devuelve (FINALIZADO)
    // un recurso. Queremos avisar SOLO a los sanitarios a los que les
    // afecta el evento: aquellos que tienen alguna reserva no terminada
    // sobre ese mismo recurso (porque están esperando turno, o porque
    // lo tienen en uso). Si no filtráramos, todos los sanitarios verían
    // ruido continuamente.
    // -----------------------------------------------------------------
    else if (msg.tipo === 'reserva') {
        console.log('[WS] Procesando aviso reserva. idRecurso:', msg.idRecurso, 'accion:', msg.accion);

        // 1) Sacamos del modelo (datos.js) las reservas NO finalizadas
        //    sobre ese recurso. fecha_fin null == reserva todavía viva
        //    (puede estar en uso o en cola, da igual: nos interesan
        //    ambos casos para avisar).
        var reservasActivas = datos.reservas.filter(function(r) {
            return r.recurso === msg.idRecurso && !r.fecha_fin;
        });
        // 2) Extraemos los ids de los sanitarios afectados.
        var idsSanitariosAfectados = reservasActivas.map(function(r) { return r.sanitario; });

        // 3) Garantizamos que el propio actor también recibe la
        //    confirmación del evento, aunque su reserva ya esté
        //    finalizada (p.ej. acaba de devolver el recurso y por
        //    tanto su reserva tiene fecha_fin: ya no entra en el
        //    filter anterior, pero queremos que vea el aviso).
        if (msg.idSanitario && !idsSanitariosAfectados.includes(msg.idSanitario)) {
            idsSanitariosAfectados.push(msg.idSanitario);
        }

        console.log('[WS] Sanitarios afectados:', idsSanitariosAfectados);
        console.log('[WS] Clientes conectados:', clientes.map(function(c){ return c.tipo+':'+c.id; }));

        // 4) Construimos el texto del aviso. msg.accion suele ser
        //    'INICIADO' o 'FINALIZADO'; si no llegara, ponemos un
        //    valor genérico para no romper la frase.
        var accion = msg.accion || 'MODIFICADO';
        var texto = 'SE HA ' + accion + ' LA RESERVA DEL ' +
            msg.nombreCategoria.toUpperCase() + ' MODELO ' +
            msg.nombreModelo.toUpperCase() + ' CON CÓDIGO ' + msg.numSerie;

        var aviso = JSON.stringify({ color: 'rojo', fecha: ahora, origen: origen, texto: texto });

        // 5) Fan-out selectivo: solo a sanitarios cuyo id está en la
        //    lista de afectados y cuyo socket esté OPEN. Contamos los
        //    envíos para log/diagnóstico.
        var enviados = 0;
        clientes.forEach(function(c) {
            if (c.tipo === 'sanitario' &&
                idsSanitariosAfectados.includes(c.id) &&
                c.ws.readyState === WebSocket.OPEN) {
                c.ws.send(aviso);
                enviados++;
            }
        });

        console.log('[WS] Aviso reserva enviado a', enviados, 'sanitarios.');
    }

    // -----------------------------------------------------------------
    // TIPO 3 (VERDE): NUEVA RESEÑA -> avisar a TODOS los gestores
    // Caso de uso: un sanitario crea una reseña; los gestores quieren
    // enterarse para hacer seguimiento de la calidad de los recursos.
    // -----------------------------------------------------------------
    else if (msg.tipo === 'resenya') {
        var texto = 'SE HA CREADO UNA RESEÑA PARA EL ' +
            msg.nombreCategoria.toUpperCase() + ' MODELO ' +
            msg.nombreModelo.toUpperCase() + ' CON CÓDIGO ' + msg.numSerie +
            ' Y PUNTUACIÓN ' + msg.puntuacion;

        var aviso = JSON.stringify({ color: 'verde', fecha: ahora, origen: origen, texto: texto });

        clientes.forEach(function(c) {
            if (c.tipo === 'gestor' && c.ws.readyState === WebSocket.OPEN) {
                c.ws.send(aviso);
            }
        });

        console.log('[WS] Aviso reseña enviado a', contarTipo('gestor'), 'gestores');
    }
}

// Cuenta cuántos clientes hay actualmente conectados de un tipo dado.
// Útil para logs y métricas; no afecta a la lógica de fan-out.
function contarTipo(tipo) {
    return clientes.filter(function(c) { return c.tipo === tipo; }).length;
}

// Exportamos solo iniciarWS porque es lo único que se llama desde
// servidor.js (orquestador). El array de clientes y procesarNotificacion
// son detalles internos.
module.exports = { iniciarWS: iniciarWS };

// =====================================================================
// REPASO
// =====================================================================
// API mínima del servidor 'ws' en Node:
//     var WebSocket = require('ws');
//     var wss = new WebSocket.Server({ port: 3502 });
//     wss.on('connection', function(ws) {
//         ws.on('message', function(data) { ... });
//         ws.on('close',   function()     { ... });
//         ws.on('error',   function(err)  { ... });
//         ws.send('texto o JSON.stringify(obj)');
//     });
//
// API mínima del cliente WS en navegador:
//     var ws = new WebSocket('ws://localhost:3502');
//     ws.onopen    = function()  { ws.send(JSON.stringify({...})); };
//     ws.onmessage = function(e) { var msg = JSON.parse(e.data); ... };
//     ws.onclose   = function()  { ... };
//     ws.onerror   = function()  { ... };
//
// Pasos para una arquitectura como esta:
//   1) Cliente abre WS y manda 'register' con su tipo+id.
//   2) Servidor guarda esa conexión en una lista junto a tipo+id.
//   3) Cuando un cliente realiza una acción, manda un 'notificar'.
//   4) Servidor filtra la lista de clientes y reenvía a los relevantes.
//   5) Al desconectar, servidor elimina la conexión de la lista.
//
// Diferencias frente a REST/RPC (importante para preguntas teóricas):
//   - REST/RPC: conexión por petición, sin estado, cliente inicia.
//   - WS: conexión PERSISTENTE, con estado (la lista de clientes vive
//     en memoria), cualquiera de los dos extremos puede iniciar el
//     envío. Ideal para notificaciones push y tiempo real.
//
// Cuándo NO usar WS:
//   - Si solo necesitas request/response, REST es más simple y cacheable.
//   - Si hay proxys/firewalls que no soportan Upgrade (raro hoy día).
// =====================================================================


// #####################################################################
// #####################################################################
// ##                                                                 ##
// ##   POSIBLES EJERCICIOS DE EXAMEN                                 ##
// ##                                                                 ##
// #####################################################################
// #####################################################################

/* ---------------------------------------------------------------------
   EJERCICIO 1 — Aviso "te toca" al siguiente de la cola
---------------------------------------------------------------------
Enunciado:
    Cuando un sanitario DEVUELVE un recurso (accion === 'FINALIZADO'),
    además del aviso ROJO normal, hay que enviar un aviso VERDE
    privado al sanitario que tiene la reserva pendiente más antigua
    sobre ese recurso, diciéndole que puede retirarlo.

Patrón que entra: UNICAST por id (buscar UNA sola conexión) +
lógica de cola FIFO sobre datos.reservas.

Mensaje servidor -> cliente (el cliente ya sabe pintarlo):
    { color: 'verde', fecha, origen: 'Sistema', texto: '...' }

Dónde va: dentro de procesarNotificacion, en la rama tipo === 'reserva',
justo después del fan-out rojo.

Código:

    if (msg.accion === 'FINALIZADO') {
        // Cola pendiente para ese recurso, ordenada por fecha_peticion
        var siguiente = datos.reservas
            .filter(function(r) {
                return r.recurso === msg.idRecurso && !r.fecha_inicio;
            })
            .sort(function(a, b) {
                return new Date(a.fecha_peticion) - new Date(b.fecha_peticion);
            })[0];

        if (siguiente) {
            var textoTurno = 'TE TOCA: EL RECURSO ' + msg.numSerie +
                             ' ESTÁ LIBRE. PUEDES RETIRARLO.';
            var avisoTurno = JSON.stringify({
                color: 'verde', fecha: ahora, origen: 'Sistema',
                texto: textoTurno
            });
            clientes.forEach(function(c) {
                if (c.tipo === 'sanitario' &&
                    c.id   === siguiente.sanitario &&
                    c.ws.readyState === WebSocket.OPEN) {
                    c.ws.send(avisoTurno);
                }
            });
        }
    }

Trampas típicas:
    - Olvidar comprobar readyState === OPEN.
    - Olvidar el caso "no hay nadie en cola" (siguiente === undefined).
    - Hacer broadcast en vez de unicast: el aviso es solo para uno.
--------------------------------------------------------------------- */


/* ---------------------------------------------------------------------
   EJERCICIO 2 — Alerta a gestores cuando un recurso tiene mala media
---------------------------------------------------------------------
Enunciado:
    Tras crear una reseña, si la nota media del recurso baja de 2 y
    hay al menos 3 reseñas (para que la media sea representativa),
    avisar a TODOS los gestores con un mensaje ROJO de mantenimiento.

Patrón que entra: TRIGGER condicional sobre un AGREGADO del modelo
(no es un evento bruto, hay que CALCULAR algo de datos.resenyas).

Dónde va: dentro de procesarNotificacion, en la rama
tipo === 'resenya', después del aviso verde normal a gestores.

Código:

    var resenyasRec = datos.resenyas.filter(function(r) {
        return r.recurso === msg.idRecurso;
    });
    if (resenyasRec.length >= 3) {
        var suma = resenyasRec.reduce(function(s, r) { return s + r.valor; }, 0);
        var media = suma / resenyasRec.length;
        if (media < 2) {
            var alerta = JSON.stringify({
                color: 'rojo', fecha: ahora, origen: 'Sistema',
                texto: 'ALERTA MANTENIMIENTO: ' + msg.numSerie +
                       ' MEDIA ' + media.toFixed(1) + ' SOBRE 5.'
            });
            clientes.forEach(function(c) {
                if (c.tipo === 'gestor' &&
                    c.ws.readyState === WebSocket.OPEN) {
                    c.ws.send(alerta);
                }
            });
        }
    }

Trampas típicas:
    - Dividir por 0 si no hay reseñas.
    - No usar el operador estricto en la comparación de tipos.
    - Mandarlo también a los sanitarios "por si acaso".
--------------------------------------------------------------------- */


/* ---------------------------------------------------------------------
   EJERCICIO 3 — Mensaje DIRECTO entre dos sanitarios (chat 1-a-1)
---------------------------------------------------------------------
Enunciado:
    El cliente debe poder enviar un mensaje libre a otro sanitario
    concreto por su id, y el servidor entregarlo solo a ese destinatario.

Patrón que entra: NUEVO action en el handler de 'message' (no es un
'notificar'), UNICAST por id.

Mensaje cliente -> servidor:
    { action: 'msg_directo', destino: '<idSanitario>', texto: '...' }

Mensaje servidor -> cliente:
    { color: 'azul', fecha, origen, texto: 'DE Fulano: <texto>' }

Dónde va: dentro del handler ws.on('message', ...) de iniciarWS,
añadiendo otra rama else if junto a las de 'register' y 'notificar'.

Código:

    else if (msg.action === 'msg_directo') {
        var fecha = new Date().toLocaleString('es-ES');
        var aviso = JSON.stringify({
            color : 'azul',
            fecha : fecha,
            origen: cliente.id || 'Anon',
            texto : 'MENSAJE DE ' + (cliente.id || 'Anon') + ': ' + msg.texto
        });
        clientes.forEach(function(c) {
            if (c.tipo === 'sanitario' &&
                c.id   === msg.destino &&
                c.ws.readyState === WebSocket.OPEN) {
                c.ws.send(aviso);
            }
        });
    }

Trampas típicas:
    - Confundir cliente (el emisor, capturado en el closure) con c
      (el destinatario, en el forEach).
    - Permitir que se mande a sí mismo (añadir c.id !== cliente.id
      si así lo pide el enunciado).
--------------------------------------------------------------------- */


/* ---------------------------------------------------------------------
   EJERCICIO 4 — Broadcast PERIÓDICO de estadísticas (push del servidor)
---------------------------------------------------------------------
Enunciado:
    Cada 30 segundos, el servidor manda a todos los gestores
    conectados cuántos recursos están en uso en este momento.

Patrón que entra: la NOTIFICACIÓN NO la dispara un cliente, la
dispara el propio SERVIDOR con setInterval. Esto es lo que demuestra
de verdad que WS es bidireccional (REST no podría hacer esto sin
que el cliente preguntara).

Dónde va: al final de iniciarWS, después del console.log de "Servidor
WebSocket escuchando...". También vale ponerlo a nivel de módulo si
no depende de variables locales.

Código:

    setInterval(function() {
        var enUso = datos.reservas.filter(function(r) {
            return r.fecha_inicio && !r.fecha_fin;
        }).length;

        var aviso = JSON.stringify({
            color : 'azul',
            fecha : new Date().toLocaleString('es-ES'),
            origen: 'Sistema',
            texto : 'RECURSOS EN USO AHORA MISMO: ' + enUso
        });

        clientes.forEach(function(c) {
            if (c.tipo === 'gestor' &&
                c.ws.readyState === WebSocket.OPEN) {
                c.ws.send(aviso);
            }
        });
    }, 30000);

Trampas típicas:
    - Crear varios setInterval por cada conexión (debe ser UNO solo
      a nivel del servidor, no dentro de wss.on('connection')).
    - Olvidar readyState: con clientes que se desconectan, sin la
      comprobación tendrías excepciones al hacer .send().
--------------------------------------------------------------------- */


/* ---------------------------------------------------------------------
   EJERCICIO 5 — Nuevo TIPO de aviso: recurso marcado como averiado
---------------------------------------------------------------------
Enunciado:
    Cuando un gestor marca un recurso como averiado, avisar a todos
    los sanitarios que tienen una reserva sin finalizar sobre ese
    recurso (en uso o en cola) para que la cancelen o devuelvan.

Patrón que entra: NUEVO TIPO dentro de 'notificar' + MULTICAST
selectivo a los afectados (parecido al tipo 'reserva' actual, pero
con texto y color distintos).

Mensaje cliente -> servidor:
    { action:'notificar', tipo:'averiado', idRecurso, origen,
      nombreCategoria, nombreModelo, numSerie }

Dónde va: en procesarNotificacion, una rama else if más al final.

Código:

    else if (msg.tipo === 'averiado') {
        var afectadas = datos.reservas.filter(function(r) {
            return r.recurso === msg.idRecurso && !r.fecha_fin;
        });
        var ids = afectadas.map(function(r) { return r.sanitario; });

        var texto = 'AVERÍA: EL RECURSO ' +
            msg.nombreCategoria.toUpperCase() + ' MODELO ' +
            msg.nombreModelo.toUpperCase() + ' CON CÓDIGO ' +
            msg.numSerie + ' HA SIDO MARCADO COMO AVERIADO.';

        var aviso = JSON.stringify({
            color: 'rojo', fecha: ahora, origen: origen, texto: texto
        });

        clientes.forEach(function(c) {
            if (c.tipo === 'sanitario' &&
                ids.includes(c.id) &&
                c.ws.readyState === WebSocket.OPEN) {
                c.ws.send(aviso);
            }
        });
    }

Trampas típicas:
    - No incluir las reservas pendientes (sin fecha_inicio):
      filtramos por !r.fecha_fin, no por r.fecha_inicio.
    - Olvidar añadir el procedimiento en el cliente (donde se
      marca el recurso) para que mande este 'notificar'.
--------------------------------------------------------------------- */


/* ---------------------------------------------------------------------
   EJERCICIO 6 — Heartbeat (ping/pong) para detectar zombis
---------------------------------------------------------------------
Enunciado:
    Detectar y cerrar conexiones que se han quedado colgadas (red
    caída, navegador zombi) sin esperar al timeout de TCP.

Patrón que entra: usar los FRAMES de control PING / PONG que el
protocolo WS define. El servidor manda ping cada N segundos; si el
cliente no responde con pong antes del siguiente tick, se considera
muerto y se cierra.

Dónde va: dentro de iniciarWS. La parte de marcar 'isAlive' se mete
dentro de wss.on('connection'); el barrido va al final, una sola vez.

Código:

    // ... dentro de wss.on('connection', function(ws) { ... }) ...
    ws.isAlive = true;
    ws.on('pong', function() { ws.isAlive = true; });

    // ... fuera de wss.on('connection'), al final de iniciarWS ...
    setInterval(function() {
        wss.clients.forEach(function(ws) {
            if (ws.isAlive === false) {
                return ws.terminate(); // ya estaba muerto: lo matamos
            }
            ws.isAlive = false; // se rearma a true solo si llega pong
            ws.ping();
        });
    }, 30000);

Concepto a recordar:
    - ping/pong son frames PROPIOS del protocolo WS (no son mensajes
      'message' de aplicación). El cliente del navegador los responde
      AUTOMÁTICAMENTE; no hay que tocar el cliente.
    - ws.terminate() corta a saco; ws.close() pide un cierre limpio.
      Para zombis, terminate.
--------------------------------------------------------------------- */


/* ---------------------------------------------------------------------
   PISTAS GENERALES SI EN EL EXAMEN PIDEN UN AVISO NUEVO
---------------------------------------------------------------------

   1) Decide el "tipo" de mensaje y añádelo al protocolo:
      ¿es una notificación más? -> nueva rama en procesarNotificacion.
      ¿es una acción cliente -> servidor de otra naturaleza
      (mensaje directo, suscripción, etc.)? -> nueva rama en
      ws.on('message') con otro msg.action.

   2) Decide quién recibe:
      - Todos los sanitarios / todos los gestores -> filtro por tipo.
      - Un grupo según el modelo (datos.reservas, datos.resenyas...)
        -> haces el filter en el array correspondiente, sacas los
        ids con .map, y luego en clientes.forEach pides que c.id
        esté en esa lista (.includes).
      - Una sola persona -> compara c.id === idDestino directamente.

   3) Antes de cada .send():
      if (c.ws.readyState === WebSocket.OPEN) { c.ws.send(aviso); }

   4) Formato del aviso siempre el mismo, así no tocas el cliente:
      JSON.stringify({ color, fecha, origen, texto })
      donde color ∈ {'azul','rojo','verde'} para que la UI lo pinte.

   5) Si el disparo es periódico (no viene de un cliente), usa
      setInterval(fn, ms) UNA VEZ a nivel del servidor, no dentro
      del handler de 'connection'.

   6) Si modificas el modelo (datos.reservas, datos.resenyas, ...),
      recuerda que es el MISMO array que ven REST y RPC; cualquier
      cambio se ve desde los tres servidores. No hace falta sincronizar.
--------------------------------------------------------------------- */

