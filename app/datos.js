var medicos= [{"nom":"Martina", "ape":"García", "edad":33}]
var pacientes=[{"nom":"Miguel", "ape":"Lopez", "edad":40}]

/**
* * Array de Sanitarios - Donde me invento 2-3 objetos por cada array 
* ? id = Numero identificativo del sanitario {1,2,3,...}
* ? nom = nombre del sanitario
* ? ape = apellidos del sanitario
* ? user = usuario (único) del sanitario
* ? pswd = Password, contraseña del login de dicho sanitario
* ! id y user SON UNICOS
*/
var sanitarios = [
    {"id": "1", "nom": "Alfonso", "ape": "Garcia", "user": "AG1", "pswd": "1234"},
    {"id": "2", "nom": "Beatriz", "ape": "Luna",   "user": "BL2", "pswd": "1234"},
    {"id": "3", "nom": "Carlos",  "ape": "Perez",  "user": "CP3", "pswd": "1234"},
    {"id": "4", "nom": "Diana",   "ape": "Sanz",   "user": "DS4", "pswd": "1234"},
    {"id": "5", "nom": "Elena",   "ape": "Gomez",  "user": "EG5", "pswd": "1234"}
]

/**
 * * Array de Gestores
 * ! id y user es UNICO
 */
var gestores = [
    {"id": "admin", "nom": "Mangel", "ape": "Amoros", "user": "admin", "pswd": "1234"},
    {"id": "1", "nom": "Ricardo", "ape": "Mora",    "user": "RM1", "pswd": "gestor123"},
    {"id": "2", "nom": "Laura",   "ape": "Vidal",   "user": "LV2", "pswd": "admin456"},
    {"id": "3", "nom": "Sergio",  "ape": "Tello",   "user": "ST3", "pswd": "pass789"},
    {"id": "4", "nom": "Monica",  "ape": "Ruiz",    "user": "MR4", "pswd": "mruiz2024"},
    {"id": "5", "nom": "Javier",  "ape": "Lopez",   "user": "JL5", "pswd": "clave101"}
]

/**
 * * Array de ubicaciones
 * Conjunto de ubicaciones (salas, almacenes, laboratorios...) donde están disponibles los recursos
 * ? id = Numero identificativo de la propia ubicacion
 * Comupuesto de = [S] + ["numero_de_sala"] 
 * ? nom = nomnbre de la propia ubicación
 * ! no hay 2 salas iguales, todas las ubicaciones son únicas
 */
var ubicaciones = [
    {"id": "S01", "nom": "Almacén Central"},
    {"id": "S02", "nom": "Sala de Espera"},
    {"id": "S03", "nom": "Laboratorio Clínico"},
    {"id": "S04", "nom": "Quirófano A"},
    {"id": "S05", "nom": "Quirófano B"},
    {"id": "S06", "nom": "Sala de Rayos X"},
    {"id": "S07", "nom": "UCI Adultos"},
    {"id": "S08", "nom": "Farmacia"},
    {"id": "S09", "nom": "Consultorio 101"},
    {"id": "S10", "nom": "Área de Triaje"}
]

/**
 * * Array de categorías
 * Clasificación de recursos con IDs nemotécnicos (3 siglas)
 */
var categorias = [
    {"id": "TER", "nom": "Termómetros"},                
    {"id": "EST", "nom": "Estetoscopios"},              
    {"id": "EFG", "nom": "Esfigmomanómetros"},          
    {"id": "OXI", "nom": "Oxímetros de pulso"},         
    {"id": "EPI", "nom": "Equipos de protección"},      
    {"id": "MAT", "nom": "Material de cura"},           
    {"id": "JER", "nom": "Jeringas y Agujas"},          
    {"id": "DES", "nom": "Desinfectantes"},             
    {"id": "SON", "nom": "Sondas y Catéteres"},         
    {"id": "MOB", "nom": "Mobiliario clínico"}          
];

/**
 * * Array de modelos
 * El ID se compone de: [SIGLAS_CATEGORIA] + [Número_Correlativo]
 */
var modelos = [
    {"id": "TER1", "nom": "AYS-123",                    "categoria": "TER", "horas_max": 8},
    {"id": "TER2", "nom": "AYS-124",                    "categoria": "TER", "horas_max": 8},
    {"id": "TER3", "nom": "DIGI-TEMP Pro",              "categoria": "TER", "horas_max": 10},
    {"id": "EST1", "nom": "LITT-Classic III",           "categoria": "EST", "horas_max": 12},
    {"id": "EST2", "nom": "LITT-Cardiology IV",         "categoria": "EST", "horas_max": 15},
    {"id": "EFG1", "nom": "OMRON-M3",                   "categoria": "EFG", "horas_max": 6},
    {"id": "EFG2", "nom": "OMRON-EVOLV",                "categoria": "EFG", "horas_max": 6},
    {"id": "OXI1", "nom": "OXI-Check 500",              "categoria": "OXI", "horas_max": 24},
    {"id": "EPI1", "nom": "Kit Mascarillas N95",        "categoria": "EPI", "horas_max": 4},
    {"id": "EPI2", "nom": "Bata Protectora Reforzada",  "categoria": "EPI", "horas_max": 8},
    {"id": "MAT1", "nom": "Venda-Elastic 5m",           "categoria": "MAT", "horas_max": 2},
    {"id": "JER1", "nom": "Jeringa 5ml Luer-Lock",      "categoria": "JER", "horas_max": 1},
    {"id": "JER2", "nom": "Aguja Hipodérmica 21G",      "categoria": "JER", "horas_max": 1},
    {"id": "DES1", "nom": "Gel Hidroalcohólico 1L",     "categoria": "DES", "horas_max": 0},
    {"id": "SON1", "nom": "Sonda Foley 16Fr",           "categoria": "SON", "horas_max": 168}, 
    {"id": "MOB1", "nom": "Camilla Articulada X3",      "categoria": "MOB", "horas_max": 8760} 
]

/**
 * * Array de recursos
 * Conjunto de recursos (unidades físicas individuales) dados de alta en el sistema. 
 */
var recursos = [
    {"id": "R001", "modelo": "TER1", "ubi": "S01", "num_serie": "131237A",      "estado": "0"}, 
    {"id": "R002", "modelo": "TER3", "ubi": "S02", "num_serie": "131238B",      "estado": "0"}, 
    {"id": "R003", "modelo": "EST1", "ubi": "S09", "num_serie": "EST-9921",     "estado": "2"}, 
    {"id": "R004", "modelo": "EFG1", "ubi": "S10", "num_serie": "SN-EFG-001",   "estado": "0"}, 
    {"id": "R005", "modelo": "OXI1", "ubi": "S07", "num_serie": "OXI-7712X",    "estado": "1"}, 
    {"id": "R006", "modelo": "EPI1", "ubi": "S08", "num_serie": "LOT-2024-01",  "estado": "0"}, 
    {"id": "R007", "modelo": "MOB1", "ubi": "S04", "num_serie": "CAM-A1-001",   "estado": "0"}, 
    {"id": "R008", "modelo": "TER3", "ubi": "S03", "num_serie": "DT-5566G",     "estado": "2"}, 
    {"id": "R009", "modelo": "SON1", "ubi": "S01", "num_serie": "SND-9900",     "estado": "0"}, 
    {"id": "R010", "modelo": "EST2", "ubi": "S09", "num_serie": "EST-4433",     "estado": "2"},
    {"id": "R011", "modelo": "TER1", "ubi": "S01", "num_serie": "131240C",      "estado": "0"},
    {"id": "R012", "modelo": "EFG2", "ubi": "S10", "num_serie": "EVOLV-001",    "estado": "0"},
    {"id": "R013", "modelo": "OXI1", "ubi": "S07", "num_serie": "OXI-8822Y",    "estado": "0"},
    {"id": "R014", "modelo": "MOB1", "ubi": "S05", "num_serie": "CAM-B2-002",   "estado": "0"},
    {"id": "R015", "modelo": "EST1", "ubi": "S04", "num_serie": "EST-8811",     "estado": "0"},
    {"id": "R016", "modelo": "SON1", "ubi": "S01", "num_serie": "SND-9901",     "estado": "0"},
    {"id": "R017", "modelo": "DES1", "ubi": "S08", "num_serie": "GEL-100",       "estado": "0"},
    {"id": "R018", "modelo": "EPI2", "ubi": "S01", "num_serie": "BAT-500",      "estado": "0"},
    {"id": "R019", "modelo": "TER2", "ubi": "S06", "num_serie": "AYS124-X",     "estado": "1"},
    {"id": "R020", "modelo": "JER1", "ubi": "S08", "num_serie": "JER-001",      "estado": "0"}
];

/**
 * * Array de reservas
 */
var reservas = [
    // --- RECURSO R001 (Termómetro TER1) ---
    { "id": "1", "recurso": "R001", "sanitario": "1", "horas_estimadas": 2, "fecha_peticion": new Date("2026-02-10T08:30:00"), "fecha_inicio": new Date("2026-02-10T09:00:00"), "fecha_fin": new Date("2026-02-10T10:30:00") }, // BLANCO
    { "id": "2", "recurso": "R001", "sanitario": "2", "horas_estimadas": 1, "fecha_peticion": new Date("2026-02-12T11:00:00"), "fecha_inicio": new Date("2026-02-12T11:15:00"), "fecha_fin": new Date("2026-02-12T12:00:00") }, // BLANCO
    { "id": "3", "recurso": "R001", "sanitario": "3", "horas_estimadas": 2, "fecha_peticion": new Date("2026-02-21T08:00:00"), "fecha_inicio": new Date("2026-02-21T08:30:00"), "fecha_fin": null }, // ROJO (Ayer, pasado de horas)
    { "id": "4", "recurso": "R001", "sanitario": "4", "horas_estimadas": 4, "fecha_peticion": new Date("2026-02-22T20:00:00"), "fecha_inicio": null, "fecha_fin": null }, // VERDE (Pendiente)

    // --- RECURSO R002 (Termómetro TER3) ---
    { "id": "5", "recurso": "R002", "sanitario": "5", "horas_estimadas": 3, "fecha_peticion": new Date("2026-02-15T09:00:00"), "fecha_inicio": new Date("2026-02-15T09:10:00"), "fecha_fin": new Date("2026-02-15T11:45:00") }, // BLANCO
    { "id": "6", "recurso": "R002", "sanitario": "1", "horas_estimadas": 8, "fecha_peticion": new Date("2026-02-22T18:00:00"), "fecha_inicio": new Date("2026-02-22T18:15:00"), "fecha_fin": null }, // AZUL (En uso, dentro del tiempo)
    { "id": "7", "recurso": "R002", "sanitario": "2", "horas_estimadas": 2, "fecha_peticion": new Date("2026-02-22T22:30:00"), "fecha_inicio": null, "fecha_fin": null }, // VERDE

    // --- RECURSO R004 (Tensiómetro EFG1) ---
    { "id": "8", "recurso": "R004", "sanitario": "3", "horas_estimadas": 4, "fecha_peticion": new Date("2026-02-18T10:00:00"), "fecha_inicio": new Date("2026-02-18T10:15:00"), "fecha_fin": new Date("2026-02-18T14:00:00") }, // BLANCO
    { "id": "9", "recurso": "R004", "sanitario": "4", "horas_estimadas": 48, "fecha_peticion": new Date("2026-02-21T09:00:00"), "fecha_inicio": new Date("2026-02-21T09:30:00"), "fecha_fin": null }, // AZUL (Tiene 48h, va sobrado)

    // --- RECURSO R007 (Camilla MOB1) ---
    { "id": "10", "recurso": "R007", "sanitario": "5", "horas_estimadas": 24, "fecha_peticion": new Date("2026-02-10T18:00:00"), "fecha_inicio": new Date("2026-02-11T07:00:00"), "fecha_fin": new Date("2026-02-12T07:00:00") }, // BLANCO
    { "id": "11", "recurso": "R007", "sanitario": "1", "horas_estimadas": 72, "fecha_peticion": new Date("2026-02-14T08:00:00"), "fecha_inicio": new Date("2026-02-14T09:00:00"), "fecha_fin": new Date("2026-02-17T09:00:00") }, // BLANCO
    { "id": "12", "recurso": "R007", "sanitario": "2", "horas_estimadas": 12, "fecha_peticion": new Date("2026-02-22T08:00:00"), "fecha_inicio": new Date("2026-02-22T08:30:00"), "fecha_fin": null }, // ROJO (Pedida a las 8am para 12h, ya son más de las 22:00)

    // --- RECURSO R012 (Tensiómetro EFG2) ---
    { "id": "13", "recurso": "R012", "sanitario": "3", "horas_estimadas": 6, "fecha_peticion": new Date("2026-02-19T07:00:00"), "fecha_inicio": new Date("2026-02-19T07:15:00"), "fecha_fin": new Date("2026-02-19T12:00:00") }, // BLANCO
    { "id": "14", "recurso": "R012", "sanitario": "4", "horas_estimadas": 2, "fecha_peticion": new Date("2026-02-22T21:00:00"), "fecha_inicio": new Date("2026-02-22T21:10:00"), "fecha_fin": null }, // AZUL (Pedida a las 21:00, dura 2h, aún le queda)

    // --- RECURSO R014 (Camilla B2) ---
    { "id": "15", "recurso": "R014", "sanitario": "5", "horas_estimadas": 120, "fecha_peticion": new Date("2026-02-01T10:00:00"), "fecha_inicio": new Date("2026-02-01T12:00:00"), "fecha_fin": new Date("2026-02-06T12:00:00") }, // BLANCO
    { "id": "16", "recurso": "R014", "sanitario": "1", "horas_estimadas": 48, "fecha_peticion": new Date("2026-02-20T10:00:00"), "fecha_inicio": new Date("2026-02-20T10:30:00"), "fecha_fin": null }, // ROJO (Pedida el 20 para 48h, ya pasaron)

    // --- RECURSO R015 (Estetoscopio) ---
    { "id": "17", "recurso": "R015", "sanitario": "2", "horas_estimadas": 12, "fecha_peticion": new Date("2026-02-22T07:00:00"), "fecha_inicio": new Date("2026-02-22T07:30:00"), "fecha_fin": new Date("2026-02-22T19:00:00") }, // BLANCO
    { "id": "18", "recurso": "R015", "sanitario": "3", "horas_estimadas": 8, "fecha_peticion": new Date("2026-02-22T19:30:00"), "fecha_inicio": new Date("2026-02-22T19:45:00"), "fecha_fin": null }, // AZUL

    // --- RECURSO R016 (Sonda) ---
    { "id": "19", "recurso": "R016", "sanitario": "4", "horas_estimadas": 72, "fecha_peticion": new Date("2026-02-15T08:00:00"), "fecha_inicio": new Date("2026-02-15T08:30:00"), "fecha_fin": new Date("2026-02-18T08:30:00") }, // BLANCO
    { "id": "20", "recurso": "R016", "sanitario": "5", "horas_estimadas": 24, "fecha_peticion": new Date("2026-02-22T22:00:00"), "fecha_inicio": null, "fecha_fin": null }, // VERDE

    // --- OTROS RECURSOS VARIOS ---
    { "id": "21", "recurso": "R005", "sanitario": "1", "horas_estimadas": 10, "fecha_peticion": new Date("2026-02-10T10:00:00"), "fecha_inicio": new Date("2026-02-10T10:15:00"), "fecha_fin": new Date("2026-02-10T16:00:00") }, // BLANCO
    { "id": "22", "recurso": "R006", "sanitario": "2", "horas_estimadas": 4, "fecha_peticion": new Date("2026-02-22T18:00:00"), "fecha_inicio": new Date("2026-02-22T18:10:00"), "fecha_fin": null }, // ROJO (Pedida 18h para 4h, son las 22:41, se ha pasado por poco)
    { "id": "23", "recurso": "R008", "sanitario": "3", "horas_estimadas": 5, "fecha_peticion": new Date("2026-02-22T21:30:00"), "fecha_inicio": null, "fecha_fin": null }, // VERDE
    { "id": "24", "recurso": "R018", "sanitario": "4", "horas_estimadas": 8, "fecha_peticion": new Date("2026-02-19T08:00:00"), "fecha_inicio": new Date("2026-02-19T08:10:00"), "fecha_fin": new Date("2026-02-19T15:00:00") }, // BLANCO
    { "id": "25", "recurso": "R019", "sanitario": "5", "horas_estimadas": 6, "fecha_peticion": new Date("2026-02-22T20:00:00"), "fecha_inicio": new Date("2026-02-22T20:15:00"), "fecha_fin": null } // AZUL
];

/**
 * * Array de reseñas (resenyas)
 */
var resenyas = [
    // R001
    { "id": "1", "recurso": "R001", "sanitario": "1", "fecha": new Date("2026-02-10T11:00:00"), "valor": 5, "descripcion": "Medición rapidísima. Muy útil en triaje." },
    { "id": "2", "recurso": "R001", "sanitario": "2", "fecha": new Date("2026-02-12T12:30:00"), "valor": 4, "descripcion": "Todo correcto, se limpia fácil." },
    { "id": "3", "recurso": "R001", "sanitario": "3", "fecha": new Date("2026-02-21T14:00:00"), "valor": 2, "descripcion": "Le cuesta encender a veces, lo devuelvo tarde por eso." },
    // R002
    { "id": "4", "recurso": "R002", "sanitario": "5", "fecha": new Date("2026-02-15T12:00:00"), "valor": 5, "descripcion": "El infrarrojo no falla. El mejor modelo que tenemos." },
    { "id": "5", "recurso": "R002", "sanitario": "1", "fecha": new Date("2026-02-22T20:00:00"), "valor": 4, "descripcion": "Lo estoy usando ahora mismo en planta, va genial." },
    // R004
    { "id": "6", "recurso": "R004", "sanitario": "3", "fecha": new Date("2026-02-18T14:30:00"), "valor": 4, "descripcion": "El velcro está un poco desgastado, pero el sensor va bien." },
    { "id": "7", "recurso": "R004", "sanitario": "4", "fecha": new Date("2026-02-22T16:00:00"), "valor": 5, "descripcion": "Me lo quedo todo el fin de semana para los controles habituales." },
    // R007
    { "id": "8", "recurso": "R007", "sanitario": "5", "fecha": new Date("2026-02-12T08:00:00"), "valor": 3, "descripcion": "Hace ruido el freno izquierdo." },
    { "id": "9", "recurso": "R007", "sanitario": "1", "fecha": new Date("2026-02-17T10:00:00"), "valor": 4, "descripcion": "Cómoda para traslados largos." },
    { "id": "10", "recurso": "R007", "sanitario": "2", "fecha": new Date("2026-02-22T14:00:00"), "valor": 1, "descripcion": "El cabezal se atasca, necesito a mantenimiento urgente." },
    // R012
    { "id": "11", "recurso": "R012", "sanitario": "3", "fecha": new Date("2026-02-19T12:30:00"), "valor": 5, "descripcion": "Modelo muy ergonómico." },
    { "id": "12", "recurso": "R012", "sanitario": "4", "fecha": new Date("2026-02-22T22:00:00"), "valor": 5, "descripcion": "Lectura perfecta en urgencias." },
    // R014
    { "id": "13", "recurso": "R014", "sanitario": "5", "fecha": new Date("2026-02-06T13:00:00"), "valor": 5, "descripcion": "Articulaciones de la camilla muy suaves." },
    { "id": "14", "recurso": "R014", "sanitario": "1", "fecha": new Date("2026-02-21T18:00:00"), "valor": 3, "descripcion": "El colchón necesita cambio, los pacientes se quejan un poco." },
    // R015
    { "id": "15", "recurso": "R015", "sanitario": "2", "fecha": new Date("2026-02-22T19:30:00"), "valor": 4, "descripcion": "Acústica impecable." },
    { "id": "16", "recurso": "R015", "sanitario": "3", "fecha": new Date("2026-02-22T21:00:00"), "valor": 4, "descripcion": "Todo bien, sigo con él en el turno de noche." },
    // R016
    { "id": "17", "recurso": "R016", "sanitario": "4", "fecha": new Date("2026-02-18T09:00:00"), "valor": 5, "descripcion": "Material en perfecto estado." },
    // Otros
    { "id": "18", "recurso": "R005", "sanitario": "1", "fecha": new Date("2026-02-10T16:30:00"), "valor": 2, "descripcion": "Marcaba mal el oxígeno, por eso pedí retirarlo." },
    { "id": "19", "recurso": "R006", "sanitario": "2", "fecha": new Date("2026-02-22T21:30:00"), "valor": 5, "descripcion": "EPIs completos y sellados." },
    { "id": "20", "recurso": "R018", "sanitario": "4", "fecha": new Date("2026-02-19T15:30:00"), "valor": 4, "descripcion": "Talla un poco grande pero aísla bien." }
]

module.exports.med=medicos
module.exports.pac=pacientes
module.exports.sanitarios = sanitarios
module.exports.gestores = gestores
module.exports.ubicaciones = ubicaciones
module.exports.categorias = categorias
module.exports.modelos = modelos
module.exports.recursos = recursos
module.exports.resenyas = resenyas
module.exports.reservas = reservas