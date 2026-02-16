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
 *          Comupuesto de = [S] + ["numero_de_sala"] 
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
    {"id": "TER", "nom": "Termómetros"},                // TER: Dispositivos de medición de temperatura
    {"id": "EST", "nom": "Estetoscopios"},              // EST: Instrumentos de auscultación
    {"id": "EFG", "nom": "Esfigmomanómetros"},          // EFG: Equipos de medición de tensión arterial
    {"id": "OXI", "nom": "Oxímetros de pulso"},         // OXI: Medidores de saturación de oxígeno
    {"id": "EPI", "nom": "Equipos de protección"},      // EPI: Protección individual (guantes, mascarillas)
    {"id": "MAT", "nom": "Material de cura"},           // MAT: Consumibles para heridas (vendas, gasas)
    {"id": "JER", "nom": "Jeringas y Agujas"},          // JER: Material de punción e inyección
    {"id": "DES", "nom": "Desinfectantes"},             // DES: Soluciones antisépticas y limpieza
    {"id": "SON", "nom": "Sondas y Catéteres"},         // SON: Dispositivos de drenaje o infusión
    {"id": "MOB", "nom": "Mobiliario clínico"}          // MOB: Equipamiento pesado (camillas, sillas)
];

/**
 * * Array de modelos
 * El ID se compone de: [SIGLAS_CATEGORIA] + [Número_Correlativo]
 */
var modelos = [
    //? TER: Termómetros
    {"id": "TER1", "nom": "AYS-123", "categoria": "TER", "horas_max": 8},
    {"id": "TER2", "nom": "AYS-124", "categoria": "TER", "horas_max": 8},
    {"id": "TER3", "nom": "DIGI-TEMP Pro", "categoria": "TER", "horas_max": 10},

    //? EST: Estetoscopios
    {"id": "EST1", "nom": "LITT-Classic III", "categoria": "EST", "horas_max": 12},
    {"id": "EST2", "nom": "LITT-Cardiology IV", "categoria": "EST", "horas_max": 15},

    //? EFG: Esfigmomanómetros
    {"id": "EFG1", "nom": "OMRON-M3", "categoria": "EFG", "horas_max": 6},
    {"id": "EFG2", "nom": "OMRON-EVOLV", "categoria": "EFG", "horas_max": 6},

    //? OXI: Oxímetros de pulso
    {"id": "OXI1", "nom": "OXI-Check 500", "categoria": "OXI", "horas_max": 24},

    //? EPI: Equipos de protección
    {"id": "EPI1", "nom": "Kit Mascarillas N95", "categoria": "EPI", "horas_max": 4},
    {"id": "EPI2", "nom": "Bata Protectora Reforzada", "categoria": "EPI", "horas_max": 8},

    //? MAT: Material de cura
    {"id": "MAT1", "nom": "Venda-Elastic 5m", "categoria": "MAT", "horas_max": 2},

    //? JER: Jeringas y Agujas
    {"id": "JER1", "nom": "Jeringa 5ml Luer-Lock", "categoria": "JER", "horas_max": 1},
    {"id": "JER2", "nom": "Aguja Hipodérmica 21G", "categoria": "JER", "horas_max": 1},

    //? DES: Desinfectantes
    {"id": "DES1", "nom": "Gel Hidroalcohólico 1L", "categoria": "DES", "horas_max": 0},

    //? SON: Sondas y Catéteres
    {"id": "SON1", "nom": "Sonda Foley 16Fr", "categoria": "SON", "horas_max": 168}, // 1 semana

    //? MOB: Mobiliario clínico
    {"id": "MOB1", "nom": "Camilla Articulada X3", "categoria": "MOB", "horas_max": 8760} // 1 año
]

/**
 * * Array de recursos
 * Conjunto de recursos (unidades físicas individuales) dados de alta en el sistema. 
 * @id {string} - Identificador único con formato [R] + [número de 3 dígitos] (Ej: R001).
 * @modelo {string} - FK (Foreign Key) que vincula con el ID del array de modelos.
 * @ubi {string} - FK que vincula con el ID del array de ubicaciones (S + número).
 * @num_serie {string} - Código de fabricación único del dispositivo físico.
 * @estado {string} - Código de situación operativa del recurso:
 *      ▪ "0": Operativo (Disponible para su uso o actualmente asignado).
 *      ▪ "1": De baja o defectuoso (Fuera de servicio permanente o pendiente de retirada).
 *      ▪ "2": En mantenimiento (En revisión técnica o reparación temporal).
 */
var recursos = [
    {"id": "R001", "modelo": "TER1", "ubi": "S01", "num_serie": "131237A",   "estado": "0"}, // Termómetro digital - Disponible en Almacén
    {"id": "R002", "modelo": "TER3", "ubi": "S02", "num_serie": "131238B",   "estado": "0"}, // Termómetro infrarrojo - Disponible en Sala de espera
    {"id": "R003", "modelo": "EST1", "ubi": "S09", "num_serie": "EST-9921",  "estado": "2"}, // Estetoscopio - En revisión técnica
    {"id": "R004", "modelo": "EFG1", "ubi": "S10", "num_serie": "SN-EFG-001", "estado": "0"}, // Tensiómetro - En área de Triaje
    {"id": "R005", "modelo": "OXI1", "ubi": "S07", "num_serie": "OXI-7712X",  "estado": "1"}, // Oxímetro - Retirado por fallo de sensor
    {"id": "R006", "modelo": "EPI1", "ubi": "S08", "num_serie": "LOT-2024-01", "estado": "0"}, // Pack protección - En Farmacia
    {"id": "R007", "modelo": "MOB1", "ubi": "S04", "num_serie": "CAM-A1-001", "estado": "0"}, // Camilla articulada - Lista en Quirófano A
    {"id": "R008", "modelo": "TER3", "ubi": "S03", "num_serie": "DT-5566G",   "estado": "0"}, // Termómetro - En Laboratorio Clínico
    {"id": "R009", "modelo": "SON1", "ubi": "S01", "num_serie": "SND-9900",   "estado": "0"}, // Sonda Foley - Stock en Almacén Central
    {"id": "R010", "modelo": "EST2", "ubi": "S09", "num_serie": "EST-4433",   "estado": "2"}  // Estetoscopio Cardiology - En limpieza y calibración
];

/**
 * * Array de reservas
 * Registro de asignaciones utilizando el objeto Date de JavaScript.
 * @id {string} - Identificador de la reserva.
 * @recurso {string} - FK del recurso (R001, R002...).
 * @sanitario {string} - FK del sanitario (1, 2...).
 * @horas_estimadas {number} - Tiempo de uso previsto en horas.
 * @fecha_peticion {Date} - Objeto Date con el momento de la solicitud.
 * @fecha_inicio {Date|null} - Objeto Date con el inicio real o null si está pendiente.
 */
var reservas = [
    {
        "id": "1", 
        "recurso": "R001",
        "sanitario": "1",
        "horas_estimadas": 2, 
        "fecha_peticion": new Date("2024-03-20T08:30:00"), 
        "fecha_inicio": new Date("2024-03-20T09:00:00")
    },
    {
        "id": "2", 
        "recurso": "R004",
        "sanitario": "2",
        "horas_estimadas": 1, 
        "fecha_peticion": new Date("2024-03-20T10:15:00"), 
        "fecha_inicio": null 
    },
    {
        "id": "3", 
        "recurso": "R007",
        "sanitario": "5",
        "horas_estimadas": 24, 
        "fecha_peticion": new Date("2024-03-19T18:00:00"), 
        "fecha_inicio": new Date("2024-03-20T07:00:00")
    },
    {
        "id": "4", 
        "recurso": "R002",
        "sanitario": "3",
        "horas_estimadas": 4, 
        "fecha_peticion": new Date("2024-03-20T11:00:00"), 
        "fecha_inicio": null
    },
    {
        "id": "5", 
        "recurso": "R006",
        "sanitario": "4",
        "horas_estimadas": 8, 
        "fecha_peticion": new Date("2024-03-20T12:00:00"), 
        "fecha_inicio": new Date("2024-03-20T12:05:00")
    }
]

/**
 * * Array de reseñas (resenyas)
 * Histórico de valoraciones con referencias visuales de modelos y nombres.
 */
var resenyas = [
    // --- Reseñas sobre el recurso R001 (Modelo: TER1) ---
    {
        "id": "1", 
        "recurso": "R001",    // TER1 (Termómetro AYS-123)
        "sanitario": "1",  // Alfonso Garcia
        "fecha": new Date("2025-03-31T12:32:00"), 
        "valor": 4, 
        "descripcion": "La verdad que el termómetro iba super bien, muy rápido."
    },
    {
        "id": "2", 
        "recurso": "R001",    // TER1 (Termómetro AYS-123)
        "sanitario": "3",  // Carlos Perez
        "fecha": new Date("2025-04-05T09:15:00"), 
        "valor": 5, 
        "descripcion": "Precisión excelente, comparado con otros modelos es el mejor."
    },
    {
        "id": "3", 
        "recurso": "R001",    // TER1 (Termómetro AYS-123)
        "sanitario": "2",  // Beatriz Luna
        "fecha": new Date("2025-04-10T14:20:00"), 
        "valor": 3, 
        "descripcion": "Funciona bien pero la batería se agota un poco rápido."
    },

    // --- Reseñas de otros recursos ---
    {
        "id": "4", 
        "recurso": "R004",    // EFG1 (Tensiómetro OMRON-M3)
        "sanitario": "4",  // Diana Sanz
        "fecha": new Date("2025-04-12T11:00:00"), 
        "valor": 5, 
        "descripcion": "El tensiómetro es muy intuitivo y fácil de colocar."
    },
    {
        "id": "5", 
        "recurso": "R007",    // MOB1 (Camilla Articulada X3)
        "sanitario": "5",  // Elena Gomez
        "fecha": new Date("2025-04-15T08:45:00"), 
        "valor": 2, 
        "descripcion": "La camilla hace un ruido extraño al subir el cabezal."
    },

    // --- Reseñas sobre el recurso R003 (Modelo: EST1) ---
    {
        "id": "6", 
        "recurso": "R003",    // EST1 (LITT-Classic III)
        "sanitario": "1",  // Alfonso Garcia
        "fecha": new Date("2025-04-18T16:30:00"), 
        "valor": 4, 
        "descripcion": "Buena acústica, se nota la calidad de la membrana."
    },
    {
        "id": "7", 
        "recurso": "R003",    // EST1 (LITT-Classic III)
        "sanitario": "4",  // Diana Sanz
        "fecha": new Date("2025-04-20T10:10:00"), 
        "valor": 4, 
        "descripcion": "Ligero y cómodo de llevar durante todo el turno."
    },

    // --- Más reseñas individuales ---
    {
        "id": "8", 
        "recurso": "R005",    // OXI1 (OXI-Check 500)
        "sanitario": "2",  // Beatriz Luna
        "fecha": new Date("2025-04-22T12:00:00"), 
        "valor": 1, 
        "descripcion": "El oxímetro da lecturas erróneas constantemente. No es fiable."
    },
    {
        "id": "9", 
        "recurso": "R009",    // SON1 (Sonda Foley 16Fr)
        "sanitario": "3",  // Carlos Perez
        "fecha": new Date("2025-04-25T17:50:00"), 
        "valor": 5, 
        "descripcion": "Material de esterilización correcta, sin problemas de uso."
    }
]
module.exports.med=medicos
module.exports.pac=pacientes