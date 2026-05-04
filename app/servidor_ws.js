// =====================================================================
// SERVIDOR WEBSOCKETS - Parte 3: Sistema de Avisos
// Puerto: 3502
// =====================================================================
// Gestiona conexiones WebSocket de sanitarios y gestores.
// Recibe notificaciones de los clientes y las distribuye solo a los
// destinatarios correctos según el tipo de aviso.
// =====================================================================

var WebSocket = require('ws');
var datos = require('./datos.js');

// Array de clientes conectados: { ws, tipo: 'sanitario'|'gestor', id: '...' }
var clientes = [];

function iniciarWS(puerto) {
    puerto = puerto || 3502;
    var wss = new WebSocket.Server({ port: puerto });

    wss.on('connection', function(ws) {
        var cliente = { ws: ws, tipo: null, id: null };
        clientes.push(cliente);

        ws.on('message', function(data) {
            try {
                var msg = JSON.parse(data);

                // --- REGISTRO: el cliente indica quién es ---
                if (msg.action === 'register') {
                    cliente.tipo = msg.tipo;   // 'sanitario' o 'gestor'
                    cliente.id   = msg.id;     // id numérico del usuario
                    console.log('[WS] Registrado:', cliente.tipo, cliente.id);
                }

                // --- NOTIFICACIÓN: el cliente avisa de una acción ---
                else if (msg.action === 'notificar') {
                    procesarNotificacion(msg);
                }
            } catch (e) {
                console.error('[WS] Error al parsear mensaje:', e.message);
            }
        });

        ws.on('close', function() {
            clientes = clientes.filter(function(c) { return c !== cliente; });
            console.log('[WS] Cliente desconectado:', cliente.tipo, cliente.id);
        });

        ws.on('error', function(err) {
            console.error('[WS] Error en cliente:', err.message);
        });
    });

    console.log('Servidor WebSocket escuchando en puerto ' + puerto);
}

// =====================================================================
// PROCESADO DE NOTIFICACIONES
// =====================================================================
function procesarNotificacion(msg) {
    var ahora   = new Date().toLocaleString('es-ES');
    var origen  = msg.origen || 'Desconocido';

    // --- TIPO 1 (AZUL): Nuevo recurso creado → avisar a TODOS los sanitarios ---
    if (msg.tipo === 'recurso') {
        var texto = 'SE HA CREADO UN NUEVO RECURSO ' +
            msg.nombreCategoria.toUpperCase() + ' MODELO ' +
            msg.nombreModelo.toUpperCase() + ' CON CÓDIGO ' + msg.numSerie;

        var aviso = JSON.stringify({ color: 'azul', fecha: ahora, origen: origen, texto: texto });

        clientes.forEach(function(c) {
            if (c.tipo === 'sanitario' && c.ws.readyState === WebSocket.OPEN) {
                c.ws.send(aviso);
            }
        });

        console.log('[WS] Aviso recurso enviado a', contarTipo('sanitario'), 'sanitarios');
    }

    // --- TIPO 2 (ROJO): Acción sobre reserva → avisar a sanitarios con reserva activa del recurso ---
    else if (msg.tipo === 'reserva') {
        console.log('[WS] Procesando aviso reserva. idRecurso:', msg.idRecurso, 'accion:', msg.accion);

        // Buscamos todos los sanitarios con reserva no finalizada (activa o pendiente) para ese recurso
        var reservasActivas = datos.reservas.filter(function(r) {
            return r.recurso === msg.idRecurso && !r.fecha_fin;
        });
        var idsSanitariosAfectados = reservasActivas.map(function(r) { return r.sanitario; });

        // Siempre incluir al sanitario que realizó la acción (aunque ya haya finalizado su reserva)
        if (msg.idSanitario && !idsSanitariosAfectados.includes(msg.idSanitario)) {
            idsSanitariosAfectados.push(msg.idSanitario);
        }

        console.log('[WS] Sanitarios afectados:', idsSanitariosAfectados);
        console.log('[WS] Clientes conectados:', clientes.map(function(c){ return c.tipo+':'+c.id; }));

        var accion = msg.accion || 'MODIFICADO';
        var texto = 'SE HA ' + accion + ' LA RESERVA DEL ' +
            msg.nombreCategoria.toUpperCase() + ' MODELO ' +
            msg.nombreModelo.toUpperCase() + ' CON CÓDIGO ' + msg.numSerie;

        var aviso = JSON.stringify({ color: 'rojo', fecha: ahora, origen: origen, texto: texto });

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

    // --- TIPO 3 (VERDE): Nueva reseña → avisar a TODOS los gestores ---
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

function contarTipo(tipo) {
    return clientes.filter(function(c) { return c.tipo === tipo; }).length;
}

module.exports = { iniciarWS: iniciarWS };
