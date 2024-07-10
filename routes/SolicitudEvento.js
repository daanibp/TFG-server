const express = require("express");
const router = express.Router();
const { SolicitudEvento, NotificacionesGlobales } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");

router.get("/", async (req, res) => {
    const solicitudesEventos = await SolicitudEvento.findAll({
        where: {},
    });
    res.json(solicitudesEventos);
});

router.post("/addSolicitudEvento", async (req, res) => {
    const {
        estado,
        asunto,
        fechaDeComienzo,
        comienzo,
        fechaDeFinalización,
        finalización,
        todoElDía,
        reminder,
        reminderDate,
        reminderTime,
        meetingOrganizer,
        requiredAttendees,
        optionalAttendees,
        recursosDeLaReunión,
        billingInformation,
        categories,
        description,
        location,
        mileage,
        priority,
        private,
        sensitivity,
        showTimeAs,
        UsuarioId,
    } = req.body;

    const nuevaSolicitudEvento = await SolicitudEvento.create({
        estado,
        asunto,
        fechaDeComienzo,
        comienzo,
        fechaDeFinalización,
        finalización,
        todoElDía,
        reminder,
        reminderDate,
        reminderTime,
        meetingOrganizer,
        requiredAttendees: requiredAttendees || null,
        optionalAttendees: optionalAttendees || null,
        recursosDeLaReunión: recursosDeLaReunión || null,
        billingInformation: billingInformation || null,
        categories: categories || null,
        description,
        location: location || null,
        mileage: mileage || null,
        priority,
        private,
        sensitivity,
        showTimeAs,
        UsuarioId,
    });
    // Crear la notificacion
    await NotificacionesGlobales.create({
        vista: false,
        SolicitudEventoId: nuevaSolicitudEvento.id,
    });
    res.json(nuevaSolicitudEvento);
});

router.put("/aceptar/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const solicitud = await SolicitudEvento.findByPk(id);

        // Verifica si la solicitud existe
        if (!solicitud) {
            return res.status(404).json({ error: "Solicitud no encontrada" });
        }

        // Actualiza el estado de la solicitud a "Aceptada"
        solicitud.estado = "Aceptada";
        await solicitud.save();

        // Devuelve la solicitud actualizada
        return res.json(solicitud);
    } catch (error) {
        console.error("Error al actualizar el estado de la solicitud:", error);
        return res.status(500).json({ error: "Error del servidor" });
    }
});

router.put("/denegar/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const solicitud = await SolicitudEvento.findByPk(id);

        // Verifica si la solicitud existe
        if (!solicitud) {
            return res.status(404).json({ error: "Solicitud no encontrada" });
        }

        // Actualiza el estado de la solicitud a "Denegada"
        solicitud.estado = "Denegada";
        await solicitud.save();

        // Devuelve la solicitud actualizada
        return res.json(solicitud);
    } catch (error) {
        console.error("Error al actualizar el estado de la solicitud:", error);
        return res.status(500).json({ error: "Error del servidor" });
    }
});

module.exports = router;
