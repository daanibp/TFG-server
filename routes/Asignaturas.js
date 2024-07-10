const express = require("express");
const router = express.Router();
const { Asignaturas } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { Matriculas } = require("../models");

router.get("/", async (req, res) => {
    const asignaturas = await Asignaturas.findAll({
        where: {},
    });
    res.json(asignaturas);
});

router.post("/addAsignatura", async (req, res) => {
    const { id, idAsignatura, nombreReal, nombreHorario, nombreExamen } =
        req.body;
    try {
        await Asignaturas.create({
            id: id,
            idAsignatura: idAsignatura,
            nombreReal: nombreReal,
            nombreHorario: nombreHorario,
            nombreExamen: nombreExamen,
        });
        console.log("Asignatura " + idAsignatura + " creada");
        res.status(200).send("Asignatura creada exitosamente");
    } catch (error) {
        console.error("Error al crear la asignatura:", error);
        res.status(500).send(
            "Error interno del servidor al crear la asignatura"
        );
    }
});

router.post("/addLoteAsignaturas", async (req, res) => {
    const asignaturas = req.body;
    const asignaturasCreadas = [];
    const asignaturasExistente = [];
    try {
        for (const asignatura of asignaturas) {
            // Verificar si la asignatura ya existe en la base de datos
            const asignaturaExistente = await Asignaturas.findOne({
                where: { idAsignatura: asignatura.idAsignatura },
            });
            if (!asignaturaExistente) {
                // La asignatura no existe, insertarla en la base de datos
                await Asignaturas.create(asignatura);
                asignaturasCreadas.push(asignatura);
            } else {
                // La asignatura ya existe, agregarla a la lista de asignaturas existentes
                asignaturasExistente.push(asignatura);
            }
        }
        console.log("Asignaturas creadas exitosamente: ", asignaturasCreadas);
        return res.status(201).json({
            message: "Asignaturas creadas exitosamente",
            asignaturasCreadas,
            asignaturasExistente,
        });
    } catch (error) {
        console.error("Error al crear las asignaturas:", error);
        res.status(500).send(
            "Error interno del servidor al crear las asignaturas"
        );
    }
});

router.get("/existeIdAsignatura/:idAsignatura", async (req, res) => {
    const idAsignatura = req.params.idAsignatura;
    try {
        // Buscar en la base de datos si existe algún registro con el idAsignatura proporcionado
        const asignaturaExistente = await Asignaturas.findOne({
            where: {
                idAsignatura: idAsignatura,
            },
        });

        // Si se encuentra una asignatura con el mismo idAsignatura, devolver true
        // Si no se encuentra, devolver false
        const existe = asignaturaExistente !== null;
        res.json({ existe: existe });
    } catch (error) {
        console.error(
            "Error al verificar la existencia del idAsignatura:",
            error
        );
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

router.get("/:idAsignatura", async (req, res) => {
    const idAsignatura = req.params.idAsignatura;
    try {
        // Buscar en la base de datos la asignatura con el id proporcionado
        const asignatura = await Asignaturas.findOne({
            where: {
                idAsignatura: idAsignatura,
            },
        });

        // Si se encuentra la asignatura, devolver su ID
        // Si no se encuentra, devolver un mensaje indicando que no se encontró la asignatura
        if (asignatura) {
            res.json({ idAsignatura: asignatura.id });
        } else {
            res.status(404).json({ error: "Asignatura no encontrada" });
        }
    } catch (error) {
        console.error("Error al buscar la asignatura:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

router.get("/IdNumerico/:id", async (req, res) => {
    const id = req.params.id;
    try {
        // Buscar en la base de datos la asignatura con el id proporcionado
        const asignatura = await Asignaturas.findOne({
            where: {
                id: id,
            },
        });

        // Si se encuentra la asignatura, devolver su ID
        // Si no se encuentra, devolver un mensaje indicando que no se encontró la asignatura
        if (asignatura) {
            res.json(asignatura);
        } else {
            res.status(404).json({ error: "Asignatura no encontrada" });
        }
    } catch (error) {
        console.error("Error al buscar la asignatura:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Ruta para obtener las asignaturas asociadas a un usuario
router.get("/usuario/:id/asignaturas", async (req, res) => {
    try {
        const usuarioId = req.params.id;
        // Realizar consulta a la base de datos para obtener las matriculas del usuario
        const matriculas = await Matriculas.findAll({
            where: { UsuarioId: usuarioId },
        });

        // Obtener los IDs de las asignaturas asociadas a las matriculas encontradas
        const idsAsignaturas = matriculas.map(
            (matricula) => matricula.AsignaturaId
        );

        // Realizar consulta a la base de datos para obtener las asignaturas asociadas a los IDs encontrados
        const asignaturas = await Asignaturas.findAll({
            where: { id: idsAsignaturas },
        });

        res.json({ asignaturas });
    } catch (error) {
        console.error(
            "Error al obtener las asignaturas del usuario:",
            error.message
        );
        res.status(500).json({
            error: "Error al obtener las asignaturas del usuario",
        });
    }
});

module.exports = router;
