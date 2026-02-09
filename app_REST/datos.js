var medicos=[{"nom":"Martina", "ape":"García", "edad":33}]
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
 * ? nom = nomnbre de la propia ubicación
 * ! no hay 2 salas iguales, todas las ubicaciones son únicas
 */
var ubicaciones = [
    {"id": "1", "nom": "Almacén Central"},
    {"id": "2", "nom": "Sala de Espera"},
    {"id": "3", "nom": "Laboratorio Clínico"},
    {"id": "4", "nom": "Quirófano A"},
    {"id": "5", "nom": "Quirófano B"},
    {"id": "6", "nom": "Sala de Rayos X"},
    {"id": "7", "nom": "UCI Adultos"},
    {"id": "8", "nom": "Farmacia"},
    {"id": "9", "nom": "Consultorio 101"},
    {"id": "10", "nom": "Área de Triaje"}
]

/**
 * * Array de categorías
 * Conjunto de categorías en las que se clasifican los recursos
 */
var categorias = [
    {"id": "1", "nom": "Termómetros"},
    {"id": "2", "nom": "Estetoscopios"},
    {"id": "3", "nom": "Esfigmomanómetros"},
    {"id": "4", "nom": "Oxímetros de pulso"},
    {"id": "5", "nom": "Equipos de protección (EPI)"},
    {"id": "6", "nom": "Material de cura (vendas, gasas)"},
    {"id": "7", "nom": "Jeringas y Agujas"},
    {"id": "8", "nom": "Desinfectantes y Antisépticos"},
    {"id": "9", "nom": "Sondas y Catéteres"},
    {"id": "10", "nom": "Mobiliario clínico"}
]

/**
 * * Array de modelos
 * Conjunto de modelos de los recursos que se disponen. 
 * Por ejemplo distintos modelos de un termómetro, cada uno de un proveedor:
 */
var modelos = [
    //? Categoría 1: Termómetros
    {"id": "11", "nom": "AYS-123", "categoria": "1", "horas_max": "8"},
    {"id": "12", "nom": "AYS-124", "categoria": "1", "horas_max": "8"},
    {"id": "13", "nom": "DIGI-TEMP Pro", "categoria": "1", "horas_max": "10"},

    //? Categoría 2: Estetoscopios
    {"id": "21", "nom": "LITT-Classic III", "categoria": "2", "horas_max": "12"},
    {"id": "22", "nom": "LITT-Cardiology IV", "categoria": "2", "horas_max": "15"},

    //? Categoría 3: Esfigmomanómetros (Tensiómetros)
    {"id": "31", "nom": "OMRON-M3", "categoria": "3", "horas_max": "6"},
    {"id": "32", "nom": "OMRON-EVOLV", "categoria": "3", "horas_max": "6"},

    //? Categoría 4: Oxímetros de pulso
    {"id": "41", "nom": "OXI-Check 500", "categoria": "4", "horas_max": "24"},

    //? Categoría 5: Equipos de protección (EPI)
    {"id":"51", "nom": "3M-N95 Kit", "categoria": "5", "horas_max": "4"},

    //? Categoría 6: Material de cura
    {"id": "61", "nom": "Venda-Elastic 5m", "categoria": "6", "horas_max": "2"}
]

/**
 * * Array de recursos
 * Conjunto de recursos dados de alta en el sistema. 
 * De cada modelo puede haber varios recursos.
 * ? estado { 0 = operativo , 1 = de baja / defectuoso , 2 = en mantenimiento}
 */
var recursos = [
    {"id":"1" , "modelo":"11" , "ubi":"1" , "num_serie":"131237A" , "estado":"0"},
    {},
    {}
]
module.exports.med=medicos
module.exports.pac=pacientes