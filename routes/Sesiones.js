const express = require("express");
const router = express.Router();
const { Sesiones } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const moment = require("moment");
const { Op, Sequelize } = require("sequelize");

router.get("/clases", async (req, res) => {
    const sesiones = await Sesiones.findAll({ where: { examen: false } });
    res.json(sesiones);
});

router.get("/examenes", async (req, res) => {
    const sesiones = await Sesiones.findAll({ where: { examen: true } });
    res.json(sesiones);
});

router.post("/addLoteSesiones", async (req, res) => {
    try {
        const { cuatri, nuevasSesiones, primerLote } = req.body;

        const sesionesCreadas = [];
        const sesionesDuplicadas = [];
        if (primerLote) {
            if (cuatri === "C1") {
                // Borrar sesiones donde examen: false y fechaDeComienzo entre 01/08 y 31/12 de cualquier año
                await Sesiones.destroy({
                    where: {
                        examen: false,
                        [Op.and]: [
                            Sequelize.where(
                                Sequelize.fn(
                                    "DATE_FORMAT",
                                    Sequelize.col("fechaDeComienzo"),
                                    "%m-%d"
                                ),
                                {
                                    [Op.between]: ["08-01", "12-31"],
                                }
                            ),
                        ],
                    },
                });
            } else if (cuatri === "C2") {
                // Borrar sesiones donde examen: false y fechaDeComienzo entre 01/01 y 01/07 de cualquier año
                await Sesiones.destroy({
                    where: {
                        examen: false,
                        [Op.and]: [
                            Sequelize.where(
                                Sequelize.fn(
                                    "DATE_FORMAT",
                                    Sequelize.col("fechaDeComienzo"),
                                    "%m-%d"
                                ),
                                {
                                    [Op.between]: ["01-01", "07-01"],
                                }
                            ),
                        ],
                    },
                });
            } else if (cuatri === "Examenes") {
                // Borrar todas las sesiones con examen: true
                await Sesiones.destroy({
                    where: {
                        examen: true,
                    },
                });
            }
        }

        // Obtener las sesiones existentes en la base de datos que coincidan con las nuevas sesiones
        const sesionesEnBD = await Sesiones.findAll({});

        // Iterar sobre cada sesión nueva y verificar si ya existe en la base de datos
        for (const nuevaSesion of nuevasSesiones) {
            // Convertir las fechas de las nuevas sesiones al formato Date
            nuevaSesion.fechaDeComienzo = new Date(nuevaSesion.fechaDeComienzo);
            nuevaSesion.fechaDeFinalización = new Date(
                nuevaSesion.fechaDeFinalización
            );

            // Verificar si la sesión nueva ya existe en la base de datos
            const sesionExistente = sesionesEnBD.find((sesion) => {
                const fechaFormateadaBD = new Date(
                    sesion.fechaDeComienzo
                ).getTime();
                const fechaFormateadaFinBD = new Date(
                    sesion.fechaDeFinalización
                ).getTime();

                return (
                    sesion.asunto === nuevaSesion.asunto &&
                    fechaFormateadaBD ===
                        nuevaSesion.fechaDeComienzo.getTime() &&
                    sesion.comienzo === nuevaSesion.comienzo &&
                    fechaFormateadaFinBD ===
                        nuevaSesion.fechaDeFinalización.getTime() &&
                    sesion.finalización === nuevaSesion.finalización &&
                    sesion.todoElDía === nuevaSesion.todoElDía &&
                    sesion.reminder === nuevaSesion.reminder &&
                    sesion.reminderDate === nuevaSesion.reminderDate &&
                    sesion.reminderTime === nuevaSesion.reminderTime &&
                    sesion.meetingOrganizer === nuevaSesion.meetingOrganizer &&
                    sesion.description === nuevaSesion.description &&
                    sesion.location === nuevaSesion.location &&
                    sesion.priority === nuevaSesion.priority &&
                    sesion.private === nuevaSesion.private &&
                    sesion.sensitivity === nuevaSesion.sensitivity &&
                    sesion.showTimeAs === nuevaSesion.showTimeAs.toString() &&
                    sesion.examen === nuevaSesion.examen &&
                    sesion.creadaPorMi === nuevaSesion.creadaPorMi &&
                    sesion.grupoId === nuevaSesion.grupoId
                );
            });

            // Si la sesión no existe, agregarla a la base de datos
            if (!sesionExistente) {
                const nueva = await Sesiones.create(nuevaSesion);
                sesionesCreadas.push(nueva);
            } else {
                sesionesDuplicadas.push(sesionExistente);
            }
        }

        if (sesionesCreadas.length === 0) {
            console.log(`No se agregó ninguna sesión`);
            res.json({
                message: `No se agregó ninguna sesión`,
                sesionesCreadas,
                sesionesDuplicadas,
            });
        } else {
            console.log(
                `Se agregaron ${sesionesCreadas.length} sesiones correctamente.`
            );
            res.json({
                message: `Se agregaron ${sesionesCreadas.length} sesiones correctamente.`,
                sesionesCreadas,
                sesionesDuplicadas,
            });
        }
    } catch (error) {
        console.error("Error al agregar sesiones:", error.message);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

module.exports = router;
