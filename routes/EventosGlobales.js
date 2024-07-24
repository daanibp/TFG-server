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

    console.log("Solicitud Id: ", SolicitudEventoId);

    try {
        // Verificar si ya existe un evento global con los mismos datos
        const eventoExistente = await EventosGlobales.findOne({
            where: {
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
                description,
                priority,
                private,
                sensitivity,
                showTimeAs,
                SolicitudEventoId,
                requiredAttendees: requiredAttendees || null,
                optionalAttendees: optionalAttendees || null,
                recursosDeLaReunión: recursosDeLaReunión || null,
                billingInformation: billingInformation || null,
                categories: categories || null,
                location: location || null,
                mileage: mileage || null,
            },
        });

        if (eventoExistente) {
            return res
                .status(400)
                .json({ message: "El evento global ya existe." });
        }

        // Crear un nuevo evento global
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
    } catch (error) {
        console.error("Error al crear el evento global:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

module.exports = router;
