const express = require("express");
const router = express.Router();
const { Matriculas } = require("../models");
const { Usuarios, Sesiones, Eventos } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { Op } = require("sequelize");
const { Grupo } = require("../models");

router.get("/", async (req, res) => {
    try {
        const matriculas = await Matriculas.findAll();
        res.json(matriculas);
    } catch (error) {
        console.error("Error al buscar matriculaciones:", error);
        res.status(500).json({ error: "Error al buscar matriculaciones" });
    }
});

router.get("/matriculasAlumnos", async (req, res) => {
    try {
        // Obtener todos los usuarios no profesores
        const usuariosNoProfesores = await Usuarios.findAll({
            where: {
                profesor: false,
            },
            attributes: ["id"], // Obtener solo el campo 'id' para reducir la carga de datos
        });

        const usuarioIdsNoProfesores = usuariosNoProfesores.map(
            (usuario) => usuario.id
        );

        // Obtener las matrículas de los usuarios no profesores
        const matriculasAlumnos = await Matriculas.findAll({
            where: {
                UsuarioId: { [Op.in]: usuarioIdsNoProfesores },
            },
        });

        return res.status(200).json({
            message: "Matrículas de alumnos obtenidas correctamente",
            matriculasAlumnos,
        });
    } catch (error) {
        console.error("Error al obtener las matrículas de alumnos:", error);
        return res.status(500).json({
            error: "Error interno del servidor al obtener las matrículas de alumnos",
        });
    }
});

router.post("/addMatricula", async (req, res) => {
    const { estado, UsuarioId, AsignaturaId, GrupoId } = req.body;
    try {
        // Verifica si ya existe una matrícula con el mismo UsuarioId y AsignaturaId
        const existingMatricula = await Matriculas.findOne({
            where: {
                UsuarioId: UsuarioId,
                AsignaturaId: AsignaturaId,
                GrupoId: GrupoId,
            },
        });

        // Si ya existe una matrícula con los mismos valores, devuelve un error
        if (existingMatricula) {
            return res
                .status(400)
                .send("Ya existe una matrícula para este usuario y asignatura");
        }

        // Si no existe, crea la nueva matrícula
        await Matriculas.create({
            estado: estado,
            UsuarioId: UsuarioId,
            AsignaturaId: AsignaturaId,
            GrupoId: GrupoId,
        });

        console.log(`Matrícula creada correctamente`);
        res.status(201).send("Matrícula creada exitosamente");
    } catch (error) {
        console.error("Error al crear el matrícula:", error);
        res.status(500).send(
            "Error interno del servidor al crear la matrícula"
        );
    }
});

router.put("/aceptar/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const solicitud = await Matriculas.findByPk(id);

        // Verifica si la solicitud existe
        if (!solicitud) {
            return res.status(404).json({ error: "Matrícula no encontrada" });
        }

        // Actualiza el estado de la solicitud a "Aceptada"
        solicitud.estado = "Aceptada";
        await solicitud.save();

        // Devuelve la solicitud actualizada
        return res.json(solicitud);
    } catch (error) {
        console.error("Error al actualizar el estado de la matrícula:", error);
        return res.status(500).json({ error: "Error del servidor" });
    }
});

router.put("/denegar/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const solicitud = await Matriculas.findByPk(id);

        // Verifica si la solicitud existe
        if (!solicitud) {
            return res.status(404).json({ error: "Matrícula no encontrada" });
        }

        // Actualiza el estado de la solicitud a "Denegada"
        solicitud.estado = "Denegada";
        await solicitud.save();

        // Devuelve la solicitud actualizada
        return res.json(solicitud);
    } catch (error) {
        console.error("Error al actualizar el estado de la matrícula:", error);
        return res.status(500).json({ error: "Error del servidor" });
    }
});

router.post("/addLoteMatriculas", async (req, res) => {
    const matriculasNuevas = req.body; // Obtener el array de matrículas directamente de req.body

    try {
        const matriculasCreadas = [];
        const matriculasDuplicadas = [];

        // Verificar si ya existen matrículas para las combinaciones de UsuarioId, AsignaturaId y GrupoId proporcionadas
        for (const matricula of matriculasNuevas) {
            const { UsuarioId, AsignaturaId, GrupoId } = matricula;

            const existingMatricula = await Matriculas.findOne({
                where: { UsuarioId, AsignaturaId, GrupoId },
            });

            if (existingMatricula) {
                if (existingMatricula.ver === false) {
                    await existingMatricula.update({ ver: true });
                }
                matriculasDuplicadas.push(existingMatricula);
            } else {
                const nuevaMatricula = await Matriculas.create(matricula);
                matriculasCreadas.push(nuevaMatricula);
            }
        }

        if (matriculasCreadas.length > 0) {
            // Crear eventos para las nuevas matrículas si son profesores
            const usuarioId = matriculasCreadas[0].UsuarioId;
            const usuario = await Usuarios.findOne({
                where: { id: usuarioId },
            });

            if (!usuario.uo.startsWith("UO")) {
                await Eventos.destroy({
                    where: { UsuarioId: usuarioId },
                });

                const grupoIds = matriculasCreadas.map(
                    (matricula) => matricula.GrupoId
                );

                const sesiones = await Sesiones.findAll({
                    where: { GrupoId: { [Op.in]: grupoIds } },
                });

                if (sesiones && sesiones.length > 0) {
                    const eventos = sesiones.map((sesion) => {
                        const { id, GrupoId, ...eventoData } = sesion.toJSON();
                        return {
                            ...eventoData,
                            eliminado: false,
                            eliminadoPorUsuario: false,
                            UsuarioId: usuario.id,
                        };
                    });

                    await Eventos.bulkCreate(eventos);
                }
            }
        }

        console.log(
            "Matrículas creadas correctamente:",
            matriculasCreadas.length
        );
        return res.status(201).json({
            message: "Matrículas creadas exitosamente",
            matriculasCreadas,
            numeroMatriculasCreadas: matriculasCreadas.length,
        });
    } catch (error) {
        console.error("Error al crear las matrículas:", error);
        res.status(500).send(
            "Error interno del servidor al crear las matrículas"
        );
    }
});

router.post("/updateMatriculasVer", async (req, res) => {
    const matriculasChange = req.body; // Obtener el array de matrículas directamente de req.body

    console.log("Parametrossss", matriculasChange);

    try {
        // Iterar sobre matriculasChange y actualizar el campo ver a false para cada matrícula
        for (const matricula of matriculasChange) {
            await Matriculas.update(
                { ver: false },
                {
                    where: {
                        id: matricula.id,
                    },
                }
            );
        }

        // Actualizar eventos eliminados asociados a las matrículas actualizadas
        await updateEventosEliminados(matriculasChange);

        // Enviar respuesta de éxito
        return res.status(200).json({
            message: "Las matrículas se han actualizado correctamente",
            matriculasChange, // Puedes enviar de vuelta las matrículas actualizadas si lo deseas
        });
    } catch (error) {
        console.error("Error al actualizar las matrículas:", error);
        return res
            .status(500)
            .send("Error interno del servidor al actualizar las matrículas");
    }
});

const updateEventosEliminados = async (matriculasChange) => {
    try {
        if (!matriculasChange || matriculasChange.length === 0) {
            console.log(`No se encontraron matrículas para cambiar`);
            return;
        }

        let eventos = [];

        // Recorrer cada matricula en matriculasChange
        for (const matricula of matriculasChange) {
            const { GrupoId, UsuarioId } = matricula;

            // Obtener todas las sesiones para el GrupoId actual
            const sesiones = await Sesiones.findAll({
                where: { GrupoId },
            });

            if (!sesiones || sesiones.length === 0) {
                console.log(
                    `No se encontraron sesiones para el GrupoId: ${GrupoId}`
                );
                continue;
            }

            // Crear un evento para cada sesión encontrada
            const eventosMatricula = sesiones.map((sesion) => {
                // Crear un objeto evento copiando todos los campos de la sesión excepto GrupoId, y agregando UsuarioId
                const { id, GrupoId, ...eventoData } = sesion.toJSON();
                return {
                    ...eventoData,
                    eliminado: false,
                    eliminadoPorUsuario: false,
                    UsuarioId,
                };
            });

            eventos = [...eventos, ...eventosMatricula];
        }

        console.log("Eventos a crear: ", eventos);

        // Actualizar el campo eliminado a true para los eventos encontrados
        for (const evento of eventos) {
            // Llamar a la función para actualizar el evento eliminado
            actualizarEventoEliminado(evento);
        }

        console.log(
            `Se actualizaron ${eventos.length} eventos eliminados correctamente.`
        );
    } catch (error) {
        console.error("Error al actualizar eventos eliminados:", error);
    }
};

const actualizarEventoEliminado = async (evento) => {
    try {
        // Buscar el evento en la base de datos basado en las propiedades del objeto evento
        const eventoEncontrado = await Eventos.findOne({
            where: {
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
                requiredAttendees: evento.requiredAttendees || null,
                optionalAttendees: evento.optionalAttendees || null,
                recursosDeLaReunión: evento.recursosDeLaReunión || null,
                billingInformation: evento.billingInformation || null,
                categories: evento.categories || null,
                description: evento.description,
                location: evento.location || null,
                mileage: evento.mileage || null,
                priority: evento.priority,
                private: evento.private,
                sensitivity: evento.sensitivity,
                showTimeAs: evento.showTimeAs,
                examen: evento.examen,
                creadoPorMi: evento.creadoPorMi,
                //eliminado: evento.eliminado,
                UsuarioId: evento.UsuarioId,
            },
        });

        if (!eventoEncontrado) {
            console.log("No se encontró ningún evento para actualizar");
            return;
        }

        // Actualizar el campo eliminado a true
        await eventoEncontrado.update({ eliminado: true });

        console.log("Evento actualizado correctamente");
    } catch (error) {
        console.error("Error al actualizar el evento:", error);
    }
};

// Ruta para eliminar todas las matrículas de un usuario
router.delete("/eliminarMatriculasUsuario/:UsuarioId", async (req, res) => {
    const { UsuarioId } = req.params;

    try {
        // Buscar todas las matrículas del UsuarioId proporcionado
        const matriculasUsuario = await Matriculas.findAll({
            where: { UsuarioId: UsuarioId },
        });

        // Verificar si se encontraron matrículas
        if (!matriculasUsuario || matriculasUsuario.length === 0) {
            return res.status(404).json({
                error: `No se encontraron matrículas para el usuario con ID ${UsuarioId}`,
            });
        }

        // Eliminar todas las matrículas encontradas
        await Matriculas.destroy({
            where: { UsuarioId: UsuarioId },
        });

        console.log(
            `Se eliminaron ${matriculasUsuario.length} matrículas del usuario con ID ${UsuarioId}`
        );
        res.json({
            message: `Se eliminaron ${matriculasUsuario.length} matrículas del usuario con ID ${UsuarioId}`,
        });
    } catch (error) {
        console.error("Error al eliminar las matrículas del usuario:", error);
        res.status(500).json({
            error: "Error interno del servidor al eliminar las matrículas del usuario",
        });
    }
});

router.get("/checkMatriculada", async (req, res) => {
    const { UsuarioId, AsignaturaId } = req.query;

    try {
        // Verificar si existe una matrícula para el UsuarioId y AsignaturaId proporcionados
        const matricula = await Matriculas.findOne({
            where: {
                UsuarioId: UsuarioId,
                AsignaturaId: AsignaturaId,
            },
        });

        // Devolver si la asignatura está matriculada o no
        if (matricula) {
            res.json({ matriculada: true });
        } else {
            res.json({ matriculada: false });
        }
    } catch (error) {
        console.error(
            `Error al verificar matriculación de la asignatura ${AsignaturaId}:`,
            error
        );
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

router.get("/matriculasConGrupo", async (req, res) => {
    try {
        // Obtener todas las matrículas y sus correspondientes grupos
        const matriculasConGrupo = await Matriculas.findAll({
            include: {
                model: Grupo, // Asociación con el modelo de Grupos
                attributes: ["nombre"], // Obtener solo el nombre del grupo
            },
        });

        // Mapear los resultados para obtener la estructura deseada
        const resultado = matriculasConGrupo.map((matricula) => ({
            MatriculaId: matricula.id,
            UsuarioId: matricula.UsuarioId,
            AsignaturaId: matricula.AsignaturaId,
            GrupoId: matricula.GrupoId,
            GrupoNombre: matricula.Grupo.nombre, // Acceder al nombre del grupo
        }));

        res.json(resultado);
    } catch (error) {
        console.error("Error al buscar matrículas con grupo:", error);
        res.status(500).json({ error: "Error al buscar matrículas con grupo" });
    }
});

// Ruta para obtener todas las matrículas de un usuario
router.get("/usuario/:UsuarioId", async (req, res) => {
    const { UsuarioId } = req.params;

    try {
        // Buscar todas las matrículas del UsuarioId proporcionado
        const matriculas = await Matriculas.findAll({
            where: { UsuarioId: UsuarioId },
            include: {
                model: Grupo, // Incluir la información del grupo asociado
                attributes: ["nombre"], // Obtener solo el nombre del grupo
            },
        });

        // Verificar si se encontraron matrículas
        if (!matriculas || matriculas.length === 0) {
            return res.status(404).json({
                error: `No se encontraron matrículas para el usuario con ID ${UsuarioId}`,
            });
        }

        // Mapear los resultados para obtener la estructura deseada
        const resultado = matriculas.map((matricula) => ({
            MatriculaId: matricula.id,
            UsuarioId: matricula.UsuarioId,
            AsignaturaId: matricula.AsignaturaId,
            GrupoId: matricula.GrupoId,
            GrupoNombre: matricula.Grupo.nombre,
            estado: matricula.estado,
        }));

        res.json(resultado);
    } catch (error) {
        console.error("Error al buscar las matrículas del usuario:", error);
        res.status(500).json({
            error: "Error interno del servidor al buscar las matrículas del usuario",
        });
    }
});

module.exports = router;
