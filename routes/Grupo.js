const express = require("express");
const router = express.Router();
const { Grupo } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { Matriculas } = require("../models");

router.get("/", async (req, res) => {
    const grupos = await Grupo.findAll({
        where: {},
    });
    res.json(grupos);
});

router.post("/addGrupo", async (req, res) => {
    const { nombre, tipo, AsignaturaId } = req.body;
    try {
        await Grupo.create({
            nombre: nombre,
            tipo: tipo,
            AsignaturaId: AsignaturaId,
        });
        console.log(`Grupo ${nombre} creado`);
        res.status(201).send("Grupo creado exitosamente");
    } catch (error) {
        console.error("Error al crear el grupo:", error);
        res.status(500).send("Error interno del servidor al crear el grupo");
    }
});

router.post("/addGrupos", async (req, res) => {
    const grupos = req.body;
    const gruposCreados = [];
    const gruposExistente = [];
    try {
        for (const grupo of grupos) {
            // Verificar si el grupo ya existe en la base de datos
            const grupoExistente = await Grupo.findOne({
                where: { nombre: grupo.nombre },
            });
            if (!grupoExistente) {
                // El grupo no existe, insertarlo en la base de datos
                await Grupo.create(grupo);
                gruposCreados.push(grupo);
            } else {
                // El grupo ya existe, agregarlo a la lista de grupos existentes
                gruposExistente.push(grupo);
            }
        }

        // Obtener todos los grupos después de crear los nuevos
        const todosLosGrupos = await Grupo.findAll();

        console.log("Grupos creados exitosamente: ", gruposCreados.length);
        return res.status(201).json({
            message: "Grupos creados exitosamente",
            gruposCreados,
            gruposExistente,
            todosLosGrupos,
        });
    } catch (error) {
        console.error("Error al crear los grupos:", error);
        res.status(500).send("Error interno del servidor al crear los grupos");
    }
});

router.get("/asignaturas/:asignaturaId/grupos", async (req, res) => {
    const { asignaturaId } = req.params;

    try {
        // Buscar todos los grupos asociados a la asignatura especificada
        const grupos = await Grupo.findAll({
            where: {
                AsignaturaId: asignaturaId,
            },
        });

        // Devolver los grupos encontrados
        res.json(grupos);
    } catch (error) {
        console.error("Error al buscar los grupos de la asignatura:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Ruta para obtener los grupos asociados a un usuario
router.get("/usuario/:id/grupos", async (req, res) => {
    try {
        const usuarioId = req.params.id;
        // Realizar consulta a la base de datos para obtener las matriculas del usuario
        const matriculas = await Matriculas.findAll({
            where: { UsuarioId: usuarioId, ver: true },
        });

        // Obtener los IDs de los grupos asociados a las matriculas encontradas
        const idsGrupos = matriculas.map((matricula) => matricula.GrupoId);

        // Realizar consulta a la base de datos para obtener los grupos asociados a los IDs encontrados
        const grupos = await Grupo.findAll({
            where: { id: idsGrupos },
        });

        res.json({ grupos });
    } catch (error) {
        console.error(
            "Error al obtener los grupos del usuario:",
            error.message
        );
        res.status(500).json({
            error: "Error al obtener los grupos del usuario",
        });
    }
});

module.exports = router;
