const express = require("express");
const router = express.Router();
const { EventosCompartidos, Eventos, Notificaciones } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");

router.post("/addEventosCompartidos", async (req, res) => {
    const eventosCompartidos = req.body;
    const eventosCreados = [];
    const eventosExistentes = [];
    try {
        for (const evento of eventosCompartidos) {
            // Verificar si el evento compartido ya existe en la base de datos
            const eventoExistente = await EventosCompartidos.findOne({
                where: {
                    UsuarioId: evento.UsuarioId,
                    EventoId: evento.EventoId,
                    UsuarioCreadorId: evento.UsuarioCreadorId,
                },
            });
            if (!eventoExistente) {
                // El evento compartido no existe, insertarlo en la base de datos
                const eventoCreado = await EventosCompartidos.create(evento);
                eventosCreados.push(eventoCreado);
                // Crear la notificacion
                await Notificaciones.create({
                    vista: false,
                    EventosCompartidoId: eventoCreado.id,
                });
            } else {
                // El evento compartido ya existe, agregarlo a la lista de eventos existentes
                eventosExistentes.push(eventoExistente);
            }
        }

        // Obtener todos los eventos compartidos después de crear los nuevos
        const todosLosEventosCompartidos = await EventosCompartidos.findAll();

        console.log(
            "Eventos compartidos creados exitosamente: ",
            eventosCreados.length
        );
        return res.status(201).json({
            message: "Eventos compartidos creados exitosamente",
            eventosCreados,
            eventosExistentes,
            todosLosEventosCompartidos,
        });
    } catch (error) {
        console.error("Error al crear los eventos compartidos:", error);
        res.status(500).send(
            "Error interno del servidor al crear los eventos compartidos"
        );
    }
});

// Nueva ruta para obtener todos los eventos compartidos
router.get("/allEventosCompartidos", async (req, res) => {
    try {
        const eventosCompartidos = await EventosCompartidos.findAll();
        res.status(200).json(eventosCompartidos);
    } catch (error) {
        console.error("Error al obtener los eventos compartidos:", error);
        res.status(500).send(
            "Error interno del servidor al obtener los eventos compartidos"
        );
    }
});

// Ruta para aceptar un evento compartido
router.post(
    "/aceptarEventoCompartido/:eventoCompartidoId/:idUsuario",
    async (req, res) => {
        const { eventoCompartidoId, idUsuario } = req.params;
        const { eventoId } = req.body; // Datos del evento a crear para el usuario

        try {
            // Buscar el evento compartido por su ID
            const eventoCompartido = await EventosCompartidos.findByPk(
                eventoCompartidoId
            );

            if (!eventoCompartido) {
                return res
                    .status(404)
                    .json({ message: "Evento compartido no encontrado" });
            }

            // Verificar si el evento compartido ya ha sido aceptado
            if (eventoCompartido.estado === "Aceptada") {
                return res.status(400).json({
                    message: "El evento compartido ya ha sido aceptado",
                });
            }

            // Buscar el evento compartido por su ID
            const evento = await Eventos.findByPk(eventoId);
            if (!evento) {
                return res
                    .status(404)
                    .json({ message: "Evento no encontrado" });
            }

            // Cambiar el estado del evento compartido a "Aceptada"
            eventoCompartido.estado = "Aceptada";
            await eventoCompartido.save();

            // Crear un nuevo evento para el usuario con idUsuario
            const eventoAceptado = await Eventos.create({
                asunto: evento.asunto,
                fechaDeComienzo: evento.fechaDeComienzo,
                comienzo: evento.comienzo,
                fechaDeFinalización: evento.fechaDeFinalización,
                finalización: evento.finalización,
                todoElDía: evento.todoElDía,
                reminder: evento.reminder,
                reminderDate: evento.reminderDate,
                reminderTime: evento.reminderTime,
                meetingOrganizer: evento.meetingOrganizer,
                requiredAttendees: evento.requiredAttendees,
                optionalAttendees: evento.optionalAttendees,
                recursosDeLaReunión: evento.recursosDeLaReunión,
                billingInformation: evento.billingInformation,
                categories: evento.categories,
                description: evento.description,
                location: evento.location,
                mileage: evento.mileage,
                priority: evento.priority,
                private: evento.private,
                sensitivity: evento.sensitivity,
                showTimeAs: evento.showTimeAs,
                examen: evento.examen,
                UsuarioId: idUsuario, // Usamos el idUsuario pasado como parámetro
            });

            res.status(200).json({
                message: "Evento compartido aceptado y evento creado",
                eventoAceptado,
            });
        } catch (error) {
            console.error("Error al aceptar el evento compartido:", error);
            res.status(500).send(
                "Error interno del servidor al aceptar el evento compartido"
            );
        }
    }
);

// Ruta para denegar una solicitud de evento compartido por eventoId
router.put("/denegarSolicitud/:eventoId", async (req, res) => {
    const { eventoId } = req.params;

    try {
        // Buscar el evento compartido por el eventoId
        const eventoCompartido = await EventosCompartidos.findByPk(eventoId);

        // Verificar si el evento compartido existe
        if (!eventoCompartido) {
            return res
                .status(404)
                .json({ error: "Evento compartido no encontrado" });
        }

        // Verificar si el estado del evento compartido ya es "Denegada"
        if (eventoCompartido.estado === "Denegada") {
            return res
                .status(400)
                .json({ error: "El evento compartido ya ha sido denegado." });
        }

        // Guardar el estado anterior del evento compartido antes de la actualización
        const estadoAnterior = eventoCompartido.estado;
        console.log("Estado anterior: ", estadoAnterior);

        // Actualizar el estado del evento compartido a "Denegada"
        eventoCompartido.estado = "Denegada";
        await eventoCompartido.save();

        // Si el evento compartido estaba previamente en estado "Aceptada", eliminar el evento de la tabla Eventos
        if (estadoAnterior === "Aceptada") {
            const eventoEliminado = await Eventos.destroy({
                where: {
                    id: eventoCompartido.EventoId,
                    UsuarioId: eventoCompartido.UsuarioId,
                },
            });
            console.log("Evento eliminado", eventoEliminado);

            if (eventoEliminado === 0) {
                return res
                    .status(200)
                    .json({ message: "Evento eliminado de la tabla Eventos" });
            } else {
                return res.status(500).json({
                    error: "Error al eliminar el evento de la tabla Eventos",
                });
            }
        }

        // Devolver la respuesta con el evento compartido actualizado
        return res.status(200).json(eventoCompartido);
    } catch (error) {
        console.error("Error al denegar la solicitud:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;

// Ruta para obtener los eventos compartidos para ti
router.get("/getEventosCompartidos/toUsuario/:usuarioId", async (req, res) => {
    const { usuarioId } = req.params;

    try {
        const eventos = await EventosCompartidos.findAll({
            where: { UsuarioId: usuarioId },
        });
        // Verificar si el evento compartido existe
        if (!eventos) {
            return res
                .status(404)
                .json({ error: "Eventos compartidos no encontrados" });
        }
        return res.status(200).json(eventos);
    } catch (error) {
        console.error("Error al obtner los eventos compartidos:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;
