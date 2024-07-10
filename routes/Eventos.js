const express = require("express");
const router = express.Router();
const { Eventos, EventosCompartidos } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const moment = require("moment");

router.get("/evento/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Buscar el evento compartido por el eventoId
        const evento = await Eventos.findByPk(id);

        // Verificar si el evento compartido existe
        if (!evento) {
            return res.status(404).json({ error: "Evento no encontrado" });
        }
        // Devolver la respuesta con el evento
        return res.status(200).json(evento);
    } catch (error) {
        console.error("Error al buscar un evento:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

router.get("/clases", async (req, res) => {
    const eventos = await Eventos.findAll({
        where: { examen: false },
    });
    res.json(eventos);
});
router.get("/examenes", async (req, res) => {
    const eventos = await Eventos.findAll({
        where: { examen: true },
    });
    res.json(eventos);
});

router.get("/:usuarioId", async (req, res) => {
    const usuarioId = req.params.usuarioId;
    const eventos = await Eventos.findAll({
        where: {
            UsuarioId: usuarioId,
            examen: false,
            eliminado: false,
            eliminadoPorUsuario: false,
        },
    });
    res.json(eventos);
});

router.get("/ex/:usuarioId", async (req, res) => {
    const usuarioId = req.params.usuarioId;
    const eventos = await Eventos.findAll({
        where: {
            UsuarioId: usuarioId,
            examen: true,
            eliminado: false,
            eliminadoPorUsuario: false,
        },
    });
    res.json(eventos);
});

router.post("/addEvent", async (req, res) => {
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
        examen,
        creadoPorMi,
        eliminado,
        eliminadoPorUsuario,
        UsuarioId,
    } = req.body;

    const nuevoEvento = await Eventos.create({
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
        examen,
        creadoPorMi,
        eliminado,
        eliminadoPorUsuario,
        UsuarioId,
    });
    res.json(nuevoEvento);
});

router.delete("/delete/:eventoId", async (req, res) => {
    const eventoId = req.params.eventoId;

    try {
        // Intenta encontrar el evento por su ID
        const eventoAEliminar = await Eventos.findByPk(eventoId);

        if (!eventoAEliminar) {
            return res.status(404).json({ message: "Evento no encontrado" });
        }

        eventoAEliminar.eliminadoPorUsuario = true;

        // Guarda los cambios en la base de datos
        await eventoAEliminar.save();

        res.json({ message: "Evento marcado como eliminado exitosamente" });
    } catch (error) {
        console.error(
            "Error al marcar el evento como eliminado:",
            error.message
        );
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

router.delete("/deleteMultipleByUser", async (req, res) => {
    const { ids } = req.body;

    try {
        // Verificar si hay eventos para los IDs especificados
        const eventosAEliminar = await Eventos.findAll({
            where: {
                id: ids,
            },
        });

        if (eventosAEliminar.length === 0) {
            return res.status(404).json({
                message: "No se encontraron eventos para los IDs especificados",
            });
        }

        // Marcar todos los eventos como eliminados
        await Eventos.update(
            {
                eliminadoPorUsuario: true,
            },
            {
                where: {
                    id: ids,
                },
            }
        );

        res.json({ message: "Eventos marcados como eliminados exitosamente" });
    } catch (error) {
        console.error(
            "Error al marcar los eventos como eliminados:",
            error.message
        );
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

router.post("/addLoteEventos", async (req, res) => {
    try {
        const nuevosEventos = req.body; // Array de eventos nuevos
        const eventosEnBD = await Eventos.findAll();
        let eventosAgregados = 0;

        // Si no hay eventos en la base de datos, crear todos los eventos nuevos
        if (eventosEnBD.length === 0) {
            await Eventos.bulkCreate(nuevosEventos);
            eventosAgregados = nuevosEventos.length;
        } else {
            // Iterar sobre cada evento nuevo
            for (const nuevoEvento of nuevosEventos) {
                // Convertir las fechas de los nuevos eventos al formato Date
                nuevoEvento.fechaDeComienzo = new Date(
                    nuevoEvento.fechaDeComienzo
                );
                nuevoEvento.fechaDeFinalización = new Date(
                    nuevoEvento.fechaDeFinalización
                );

                // Verificar si el evento nuevo ya existe en la base de datos
                const eventoExistente = eventosEnBD.find((evento) => {
                    // Convertir las fechas de la base de datos al formato Date
                    const fechaFormateadaBDComienzo = new Date(
                        evento.fechaDeComienzo
                    );
                    const fechaFormateadaBDFinalización = new Date(
                        evento.fechaDeFinalización
                    );

                    return (
                        evento.asunto === nuevoEvento.asunto &&
                        fechaFormateadaBDComienzo.getTime() ===
                            nuevoEvento.fechaDeComienzo.getTime() &&
                        evento.comienzo === nuevoEvento.comienzo &&
                        fechaFormateadaBDFinalización.getTime() ===
                            nuevoEvento.fechaDeFinalización.getTime() &&
                        evento.finalización === nuevoEvento.finalización &&
                        evento.todoElDía === nuevoEvento.todoElDía &&
                        evento.reminder === nuevoEvento.reminder &&
                        evento.reminderDate === nuevoEvento.reminderDate &&
                        evento.reminderTime === nuevoEvento.reminderTime &&
                        evento.meetingOrganizer ===
                            nuevoEvento.meetingOrganizer &&
                        evento.description === nuevoEvento.description &&
                        evento.location === nuevoEvento.location &&
                        evento.priority === nuevoEvento.priority &&
                        evento.private === nuevoEvento.private &&
                        evento.sensitivity === nuevoEvento.sensitivity &&
                        evento.showTimeAs ===
                            nuevoEvento.showTimeAs.toString() &&
                        evento.examen === nuevoEvento.examen &&
                        evento.creadoPorMi === nuevoEvento.creadoPorMi &&
                        //evento.eliminado === nuevoEvento.eliminado &&
                        evento.UsuarioId === nuevoEvento.UsuarioId
                    );
                });

                // Si el evento no existe, agregarlo a la base de datos
                if (!eventoExistente) {
                    try {
                        await Eventos.create(nuevoEvento);
                        eventosAgregados++;
                    } catch (validationError) {
                        console.error(
                            "Error al agregar evento:",
                            validationError.message
                        );
                        return res.status(400).json({
                            message: "Error al agregar evento",
                            error: validationError.message,
                            evento: nuevoEvento,
                        });
                    }
                } else {
                    if (eventoExistente.eliminado === true) {
                        await eventoExistente.update({ eliminado: false });
                    }
                }
            }
        }

        if (eventosAgregados === 0) {
            console.log(`No se agregó ningún evento`);
            return res.status(200).json({
                message: `No se agregó ningún evento`,
                nEventosAgregados: 0,
            });
        } else {
            console.log(
                `Se agregaron ${eventosAgregados} eventos correctamente.`
            );
            return res.status(200).json({
                message: `Se agregaron ${eventosAgregados} eventos correctamente.`,
                nEventosAgregados: eventosAgregados,
            });
        }
    } catch (error) {
        console.error("Error al agregar eventos:", error.message);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// router.delete("/deleteByUsuario/:usuarioId", async (req, res) => {
//     const usuarioId = req.params.usuarioId;

//     try {
//         // Verificar si hay eventos para el usuario especificado
//         const eventosAEliminar = await Eventos.findAll({
//             where: { UsuarioId: usuarioId },
//         });

//         if (eventosAEliminar.length === 0) {
//             return res.status(404).json({
//                 message:
//                     "No se encontraron eventos para el usuario especificado",
//             });
//         }

//         // Eliminar los eventos
//         await Eventos.destroy({
//             where: { UsuarioId: usuarioId },
//         });

//         res.json({ message: "Eventos eliminados exitosamente" });
//     } catch (error) {
//         console.error("Error al eliminar los eventos:", error.message);
//         res.status(500).json({ message: "Error interno del servidor" });
//     }
// });

router.delete("/deleteByUsuario/:usuarioId", async (req, res) => {
    const usuarioId = req.params.usuarioId;

    try {
        // Verificar si hay eventos para el usuario especificado
        const eventosAEliminar = await Eventos.findAll({
            where: { UsuarioId: usuarioId },
        });

        if (eventosAEliminar.length === 0) {
            return res.status(404).json({
                message:
                    "No se encontraron eventos para el usuario especificado",
            });
        }

        // Cambiar el campo eliminado y eliminadoPorUsuario a true para los eventos encontrados
        await Eventos.update(
            { eliminado: true, eliminadoPorUsuario: true },
            { where: { UsuarioId: usuarioId } }
        );

        res.json({ message: "Eventos marcados como eliminados exitosamente" });
    } catch (error) {
        console.error(
            "Error al marcar los eventos como eliminados:",
            error.message
        );
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

router.get("/eventosRelacionados/:idUsuario", async (req, res) => {
    const { idUsuario } = req.params;

    try {
        // Buscar todos los eventos compartidos relacionados con el usuario especificado
        const eventosCompartidos = await EventosCompartidos.findAll({
            where: {
                UsuarioId: idUsuario,
            },
        });

        // Obtener los IDs de los eventos compartidos para ti
        const eventoIds = eventosCompartidos.map((evento) => evento.EventoId);

        // Buscar todos los eventos que tengan los IDs encontrados y pertenezcan al usuario
        const eventosRelacionados = await Eventos.findAll({
            where: {
                id: eventoIds, // Filtrar por los IDs obtenidos de EventosCompartidos
            },
        });

        // Devolver los eventos relacionados encontrados
        res.status(200).json(eventosRelacionados);
    } catch (error) {
        console.error("Error al buscar eventos relacionados:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Ruta para obtener eventos eliminados por usuario
router.get("/eliminadosPorUsuario/:idUsuario", async (req, res) => {
    const { idUsuario } = req.params;

    try {
        // Buscar eventos eliminados por el usuario especificado
        const eventosEliminados = await Eventos.findAll({
            where: {
                UsuarioId: idUsuario,
                eliminadoPorUsuario: true,
                eliminado: false,
            },
        });

        res.json({ eventos: eventosEliminados });
    } catch (error) {
        console.error("Error al obtener eventos eliminados:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// Ruta para marcar un evento como no eliminado por el usuario
router.put("/recuperar/:eventoId", async (req, res) => {
    const eventoId = req.params.eventoId;

    try {
        // Busca el evento por su ID en la base de datos
        const eventoRecuperado = await Eventos.findByPk(eventoId);

        if (!eventoRecuperado) {
            return res.status(404).json({ message: "Evento no encontrado" });
        }

        // Cambia el campo eliminadoPorUsuario a false
        eventoRecuperado.eliminadoPorUsuario = false;

        // Guarda los cambios en la base de datos
        await eventoRecuperado.save();

        res.json({ message: "Evento recuperado exitosamente" });
    } catch (error) {
        console.error("Error al recuperar el evento:", error.message);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

module.exports = router;
