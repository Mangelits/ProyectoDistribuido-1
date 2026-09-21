-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 21-09-2026 a las 15:19:56
-- Versión del servidor: 10.4.28-MariaDB
-- Versión de PHP: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `Practica`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(3) NOT NULL,
  `nom` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `nom`) VALUES
(1, 'Termómetros'),
(3, 'Estetoscopios'),
(4, 'Esfingomanómetros'),
(5, 'Oxímetros de pulso'),
(6, 'Equipos de protección'),
(7, 'Material de cura'),
(8, 'Jeringas y Agujas'),
(9, 'Desinfectantes'),
(10, 'Sondas y Catéteres'),
(11, 'Mobiliario clínico');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gestores`
--

CREATE TABLE `gestores` (
  `id` int(3) NOT NULL,
  `nom` varchar(50) NOT NULL,
  `ape` varchar(50) NOT NULL,
  `user` varchar(50) NOT NULL,
  `pswd` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `gestores`
--

INSERT INTO `gestores` (`id`, `nom`, `ape`, `user`, `pswd`) VALUES
(1, 'Miguel Angel', 'Amoros Rodriguez', 'admin', '1234'),
(2, 'Lola', 'Pertusa Canales', 'LPC', '1234'),
(3, 'Jose Luis', 'Amoros', 'JLAR', '1234'),
(4, 'Manolo', 'Amoros', 'MAAR', '1234'),
(5, 'Laura', 'Lopez', 'Tilde', '1234'),
(6, 'Marcos', 'Esparra', 'MAE', '1234');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `modelos`
--

CREATE TABLE `modelos` (
  `id` int(3) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `categoria` int(3) NOT NULL,
  `horas_max` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `modelos`
--

INSERT INTO `modelos` (`id`, `nom`, `categoria`, `horas_max`) VALUES
(1, 'AYS-123', 1, 0),
(2, 'AYS-124', 1, 0),
(3, 'DIGI-Temp PRO', 1, 0),
(4, 'Braun ThermoScan 7', 1, 0),
(5, 'Omron Gentle Temp 720', 1, 0),
(6, 'Littmann Classic III', 3, 72),
(7, 'Littmann Cardiology IV', 3, 72),
(8, '3M Littmann Lightweight II', 3, 72),
(9, 'Riester Duplex 2.0', 3, 72),
(10, 'Omron M3', 4, 48),
(11, 'Omron M6 Comfort', 4, 48),
(12, 'Riester Big Ben', 4, 48),
(13, 'Welch Allyn DS44', 4, 48),
(14, 'Nonin Onyx 9500', 5, 24),
(15, 'Masimo MightySat', 5, 24),
(16, 'Beurer PO 30', 5, 24),
(17, 'Contec CMS50D', 5, 24),
(18, 'Mascarilla FFP2', 6, 0),
(19, 'Mascarilla FFP3', 6, 0),
(20, 'Bata desechable estéril', 6, 0),
(21, 'Pantalla facial protectora', 6, 0),
(22, 'Guantes de nitrilo (caja)', 6, 0),
(23, 'Vendas elásticas', 7, 0),
(24, 'Gasas estériles', 7, 0),
(25, 'Esparadrapo hipoalergénico', 7, 0),
(26, 'Apósitos adhesivos', 7, 0),
(27, 'Jeringa 5ml', 8, 0),
(28, 'Jeringa 10ml', 8, 0),
(29, 'Aguja hipodérmica 21G', 8, 0),
(30, 'Aguja intramuscular 23G', 8, 0),
(31, 'Clorhexidina 2%', 9, 0),
(32, 'Povidona yodada', 9, 0),
(33, 'Alcohol 70%', 9, 0),
(34, 'Gel hidroalcohólico', 9, 0),
(35, 'Sonda Foley 16Fr', 10, 0),
(36, 'Catéter venoso 18G', 10, 0),
(37, 'Sonda nasogástrica 14Fr', 10, 0),
(38, 'Catéter urinario de silicona', 10, 0),
(39, 'Camilla hidráulica', 11, 168),
(40, 'Silla de ruedas plegable', 11, 168),
(41, 'Carro de curas inox', 11, 168),
(42, 'Biombo separador', 11, 168),
(43, 'Taburete regulable', 11, 168),
(44, 'Lámpara de exploración', 11, 168);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recursos`
--

CREATE TABLE `recursos` (
  `id` int(3) NOT NULL,
  `modelo` int(3) NOT NULL,
  `ubi` int(3) NOT NULL,
  `num_serie` varchar(50) NOT NULL,
  `estado` enum('0','1','2') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `recursos`
--

INSERT INTO `recursos` (`id`, `modelo`, `ubi`, `num_serie`, `estado`) VALUES
(1, 1, 7, 'TERM-0001', '0'),
(2, 1, 8, 'TERM-0002', '1'),
(3, 2, 8, 'TERM-0003', '0'),
(4, 3, 3, 'TERM-0004', '0'),
(5, 4, 7, 'TERM-0005', '0'),
(6, 5, 8, 'TERM-0006', '0'),
(7, 6, 3, 'EST-0001', '0'),
(8, 7, 5, 'EST-0002', '1'),
(9, 8, 7, 'EST-0003', '2'),
(10, 9, 8, 'EST-0004', '0'),
(11, 10, 7, 'ESF-0001', '0'),
(12, 11, 8, 'ESF-0002', '0'),
(13, 12, 3, 'ESF-0003', '1'),
(14, 13, 6, 'ESF-0004', '0'),
(15, 14, 9, 'OXI-0001', '0'),
(16, 15, 10, 'OXI-0002', '0'),
(17, 16, 4, 'OXI-0003', '1'),
(18, 17, 7, 'OXI-0004', '0'),
(19, 16, 10, 'OXI-0005', '0'),
(20, 39, 3, 'MOB-0001', '0'),
(21, 40, 4, 'MOB-0002', '0'),
(22, 41, 2, 'MOB-0003', '0'),
(23, 42, 4, 'MOB-0004', '1'),
(24, 43, 7, 'MOB-0005', '0'),
(25, 44, 3, 'MOB-0006', '0'),
(26, 39, 5, 'MOB-0007', '2'),
(27, 40, 9, 'MOB-0008', '0'),
(28, 6, 6, 'EST-0005', '0'),
(29, 14, 4, 'OXI-0006', '0'),
(30, 10, 3, 'ESF-0005', '0');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `resenyas`
--

CREATE TABLE `resenyas` (
  `id` int(3) NOT NULL,
  `recurso` int(3) NOT NULL,
  `sanitario` int(3) NOT NULL,
  `fecha` datetime NOT NULL,
  `valor` int(11) NOT NULL,
  `descripcion` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `resenyas`
--

INSERT INTO `resenyas` (`id`, `recurso`, `sanitario`, `fecha`, `valor`, `descripcion`) VALUES
(1, 1, 1, '2026-09-05 10:30:00', 5, 'Termómetro preciso y rápido, sin incidencias.'),
(2, 4, 2, '2026-09-06 11:00:00', 4, 'Buen funcionamiento, lectura fiable.'),
(3, 7, 3, '2026-09-07 11:30:00', 5, 'Estetoscopio con excelente acústica.'),
(4, 11, 4, '2026-09-08 12:15:00', 3, 'Correcto, aunque el brazalete está algo desgastado.'),
(5, 15, 5, '2026-09-09 12:15:00', 4, 'Oxímetro cómodo y con buena batería.'),
(6, 20, 1, '2026-09-10 13:45:00', 5, 'Camilla estable y fácil de ajustar.'),
(7, 21, 6, '2026-09-11 11:15:00', 4, 'Silla de ruedas en buen estado.'),
(8, 10, 2, '2026-09-12 12:00:00', 2, 'La membrana del estetoscopio necesita revisión.'),
(9, 9, 5, '2026-09-13 09:15:00', 1, 'Equipo averiado durante el uso, requiere reparación.'),
(10, 18, 4, '2026-09-14 11:15:00', 4, 'Oxímetro fiable, buena relación calidad-precio.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reservas`
--

CREATE TABLE `reservas` (
  `id` int(3) NOT NULL,
  `recurso` int(3) NOT NULL,
  `sanitario` int(3) NOT NULL,
  `horas_estimadas` float NOT NULL,
  `fecha_peticion` datetime NOT NULL,
  `fecha_inicio` datetime DEFAULT NULL,
  `fecha_fin` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `reservas`
--

INSERT INTO `reservas` (`id`, `recurso`, `sanitario`, `horas_estimadas`, `fecha_peticion`, `fecha_inicio`, `fecha_fin`) VALUES
(1, 1, 1, 2, '2026-09-05 08:00:00', '2026-09-05 08:15:00', '2026-09-05 10:20:00'),
(2, 4, 2, 1.5, '2026-09-06 09:00:00', '2026-09-06 09:10:00', '2026-09-06 10:45:00'),
(3, 7, 3, 3, '2026-09-07 07:30:00', '2026-09-07 08:00:00', '2026-09-07 11:15:00'),
(4, 11, 4, 2, '2026-09-08 10:00:00', '2026-09-08 10:05:00', '2026-09-08 12:00:00'),
(5, 15, 5, 1, '2026-09-09 11:00:00', '2026-09-09 11:10:00', '2026-09-09 12:05:00'),
(6, 20, 1, 5, '2026-09-10 08:00:00', '2026-09-10 08:30:00', '2026-09-10 13:30:00'),
(7, 21, 6, 2, '2026-09-11 09:00:00', '2026-09-11 09:00:00', '2026-09-11 11:00:00'),
(8, 10, 2, 1.5, '2026-09-12 10:00:00', '2026-09-12 10:20:00', '2026-09-12 11:50:00'),
(9, 9, 5, 1, '2026-09-13 08:00:00', '2026-09-13 08:05:00', '2026-09-13 09:00:00'),
(10, 18, 4, 2, '2026-09-14 09:00:00', '2026-09-14 09:10:00', '2026-09-14 11:00:00'),
(11, 2, 1, 3, '2026-09-20 08:00:00', '2026-09-20 08:10:00', NULL),
(12, 8, 3, 2, '2026-09-20 09:00:00', '2026-09-20 09:15:00', NULL),
(13, 13, 4, 4, '2026-09-21 07:30:00', '2026-09-21 08:00:00', NULL),
(14, 17, 5, 1.5, '2026-09-21 09:00:00', '2026-09-21 09:05:00', NULL),
(15, 23, 6, 6, '2026-09-21 08:00:00', '2026-09-21 08:20:00', NULL),
(16, 12, 2, 2, '2026-09-21 10:00:00', NULL, NULL),
(17, 14, 3, 1, '2026-09-21 10:30:00', NULL, NULL),
(18, 16, 4, 3, '2026-09-21 11:00:00', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sanitarios`
--

CREATE TABLE `sanitarios` (
  `id` int(3) NOT NULL,
  `nom` varchar(50) NOT NULL,
  `ape` varchar(50) NOT NULL,
  `user` varchar(50) NOT NULL,
  `pswd` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sanitarios`
--

INSERT INTO `sanitarios` (`id`, `nom`, `ape`, `user`, `pswd`) VALUES
(1, 'Federico', 'Garcia Lorca', 'FGL', '1234'),
(2, 'Antonio', 'Gutierrez Samos', 'AGS', '1234'),
(3, 'Gustavo', 'Pertusa Traorá', 'GPT', '1234'),
(4, 'Guillermo', 'Pórtale Sanchez', 'GPS', '1234'),
(5, 'Lola', 'Pertusa Garcia Canales', 'LPGC', '1234'),
(6, 'Diego', 'Campos', 'DC', '1234');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ubicaciones`
--

CREATE TABLE `ubicaciones` (
  `id` int(3) NOT NULL,
  `nom` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ubicaciones`
--

INSERT INTO `ubicaciones` (`id`, `nom`) VALUES
(1, 'Almacén Central'),
(2, 'Laboratorio'),
(3, 'Quirófano A'),
(4, 'Sala de Espera'),
(5, 'Quirófano B'),
(6, 'Quirófano C'),
(7, 'Consultas 1'),
(8, 'Consultas 2'),
(9, 'Carro de Paradas 1'),
(10, 'Carro de Paradas 2');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `gestores`
--
ALTER TABLE `gestores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user` (`user`);

--
-- Indices de la tabla `modelos`
--
ALTER TABLE `modelos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categoria` (`categoria`);

--
-- Indices de la tabla `recursos`
--
ALTER TABLE `recursos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `num_serie` (`num_serie`),
  ADD KEY `modelo` (`modelo`),
  ADD KEY `ubi` (`ubi`);

--
-- Indices de la tabla `resenyas`
--
ALTER TABLE `resenyas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recurso` (`recurso`),
  ADD KEY `sanitario` (`sanitario`);

--
-- Indices de la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recurso` (`recurso`),
  ADD KEY `sanitario` (`sanitario`);

--
-- Indices de la tabla `sanitarios`
--
ALTER TABLE `sanitarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user` (`user`);

--
-- Indices de la tabla `ubicaciones`
--
ALTER TABLE `ubicaciones`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `gestores`
--
ALTER TABLE `gestores`
  MODIFY `id` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `modelos`
--
ALTER TABLE `modelos`
  MODIFY `id` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT de la tabla `recursos`
--
ALTER TABLE `recursos`
  MODIFY `id` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `resenyas`
--
ALTER TABLE `resenyas`
  MODIFY `id` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `reservas`
--
ALTER TABLE `reservas`
  MODIFY `id` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `sanitarios`
--
ALTER TABLE `sanitarios`
  MODIFY `id` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `ubicaciones`
--
ALTER TABLE `ubicaciones`
  MODIFY `id` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `modelos`
--
ALTER TABLE `modelos`
  ADD CONSTRAINT `modelos_ibfk_1` FOREIGN KEY (`categoria`) REFERENCES `categorias` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `recursos`
--
ALTER TABLE `recursos`
  ADD CONSTRAINT `recursos_ibfk_1` FOREIGN KEY (`modelo`) REFERENCES `modelos` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `recursos_ibfk_2` FOREIGN KEY (`ubi`) REFERENCES `ubicaciones` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `resenyas`
--
ALTER TABLE `resenyas`
  ADD CONSTRAINT `resenyas_ibfk_1` FOREIGN KEY (`recurso`) REFERENCES `recursos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `resenyas_ibfk_2` FOREIGN KEY (`sanitario`) REFERENCES `sanitarios` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD CONSTRAINT `reservas_ibfk_1` FOREIGN KEY (`recurso`) REFERENCES `recursos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `reservas_ibfk_2` FOREIGN KEY (`sanitario`) REFERENCES `sanitarios` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
