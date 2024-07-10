const express = require("express");
const router = express.Router();
const {
    NotificacionesGlobales,
    Usuarios,
    SolicitudEvento,
} = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");

// Ruta para obtener todas las notificaciones globales de un usuario específico
router.get("/", async (req, res) => {
    try {
        const notificaciones = await NotificacionesGlobales.findAll({
            include: [
                {
                    model: SolicitudEvento,
                    as: "solicitudEvento",

                    include: [
                        {
                            model: Usuarios,
                            as: "usuarioCreador",
                            attributes: ["id", "uo"],
                        },
                    ],
                },
            ],
            order: [["createdAt", "DESC"]],
        });
        res.json(notificaciones);
    } catch (error) {
        console.error("Error en las notificaciones:", error);
        res.status(500).send("Error en las notificaciones");
    }
});

// Ruta para obtener notificaciones globales sin ver de un usuario específico
router.get("/getNotificacionesSinVer/", async (req, res) => {
    try {
        const notificaciones = await NotificacionesGlobales.findAll({
            where: { vista: false },
            include: [
                {
                    model: SolicitudEvento,
                    as: "solicitudEvento",
                    include: [
                        {
                            model: Usuarios,
                            as: "usuarioCreador",
                            attributes: ["id", "uo"],
                        },
                    ],
                },
            ],
            order: [["createdAt", "DESC"]],
        });
        res.json(notificaciones);
    } catch (error) {
        console.error("Error en las notificaciones:", error);
        res.status(500).send("Error en las notificaciones");
    }
});

module.exports = router;
