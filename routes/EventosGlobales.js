const express = require("express");
const router = express.Router();
const { EventosGlobales } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");

router.get("/", async (req, res) => {
    const eventosGlobales = await EventosGlobales.findAll({
        where: {},
    });
    res.json(eventosGlobales);
});

router.post("/addGlobalEvent", async (req, res) => {
    const {
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
        SolicitudEventoId,
    } = req.body;

    const nuevoEvento = await EventosGlobales.create({
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
        SolicitudEventoId,
    });
    res.json(nuevoEvento);
});

module.exports = router;
