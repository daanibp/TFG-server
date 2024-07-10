const express = require("express");
const router = express.Router();
const { Notificaciones, Usuarios, EventosCompartidos } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");

router.get("/:usuarioId", async (req, res) => {
    const usuarioId = req.params.usuarioId;

    try {
        const notificaciones = await Notificaciones.findAll({
            where: {},
            include: [
                {
                    model: EventosCompartidos,
                    as: "eventoCompartido",
                    where: { UsuarioId: usuarioId },
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

router.get("/getNotificacionesSinVer/:usuarioId", async (req, res) => {
    const usuarioId = req.params.usuarioId;

    try {
        const notificaciones = await Notificaciones.findAll({
            where: { vista: false },
            include: [
                {
                    model: EventosCompartidos,
                    as: "eventoCompartido",
                    where: { UsuarioId: usuarioId },
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
