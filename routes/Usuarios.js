const express = require("express");
const router = express.Router();
const { Usuarios } = require("../models");
const { Matriculas, Sesiones, Eventos } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { sign, verify } = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const axios = require("axios");
const { Op } = require("sequelize");
// import dotenv from "dotenv";
// dotenv.config();

// Configuración de Nodemailer para Outlook
const transporter = nodemailer.createTransport({
    host: "smtp.office365.com", // Servidor SMTP de Outlook
    port: 587,
    secure: false, // true para el puerto 465, false para otros puertos
    auth: {
        user: "MiAreaPersonal@outlook.com",
        pass: "MiTFG/2024",
    },
});

const jwtSecret = "importantsecret";
const apiKey = "DgDdU7mwgJSgsGZFemrziHpKdJcQUJDDMxBbC3wc9ZOapyjHStf66vqxZlX4";
const bitlyApiKey = "56bfdd8350ea0e7a55cd40f082063d42727b8fc8";

async function getShortenedUrl(longUrl) {
    try {
        // Try TinyURL first
        const tinyUrlResponse = await axios.post(
            "https://api.tinyurl.com/create",
            {
                url: longUrl,
                domain: "tinyurl.com",
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return tinyUrlResponse.data.data.tiny_url;
    } catch (tinyUrlError) {
        console.error("TinyURL falló, intentando Bitly:", tinyUrlError);

        // If TinyURL fails, try Bitly
        try {
            const bitlyResponse = await axios.post(
                "https://api-ssl.bitly.com/v4/shorten",
                {
                    long_url: longUrl,
                    domain: "bit.ly",
                },
                {
                    headers: {
                        Authorization: `Bearer ${bitlyApiKey}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            return bitlyResponse.data.link;
        } catch (bitlyError) {
            console.error("Bitly también falló:", bitlyError);
            res.status(500).json({ error: "Error creando una URL más corta" });
        }
    }
}

router.post("/register", async (req, res) => {
    const { uo, newPassword } = req.body;

    try {
        // PROFESOR
        if (!uo.startsWith("UO")) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const token = sign({ uo: uo }, jwtSecret, { expiresIn: "1h" });
            const validationUrl = `http://localhost:5001/usuarios/validate/${token}`;
            const shortUrl = await getShortenedUrl(validationUrl);

            // Es un profesor y hay que crearle una cuenta
            await Usuarios.create({
                uo: uo,
                password: hashedPassword,
                //email: `${uo}@uniovi.es`,
                email: "uo277476@uniovi.es",
                admin: 0,
                profesor: true,
                estado: "Pendiente",
            });

            const mailOptions = {
                from: "MiAreaPersonal@outlook.com",
                //to: `${uo}@uniovi.es`,
                to: "uo277476@uniovi.es",
                subject: "Validación de cuenta",
                text: `Haz clic en el siguiente enlace para validar tu cuenta: ${shortUrl}`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.status(500).json({
                        error: "Error al enviar el correo de validación",
                    });
                }
                return res
                    .status(200)
                    .json({ message: "Correo de validación enviado" });
            });
        } else {
            const user = await Usuarios.findOne({ where: { uo: uo } });

            if (!user) {
                return res
                    .status(400)
                    .json({ error: "Usuario no registrado en el sistema." });
            }

            if (user.estado === "Activa") {
                return res.status(400).json({
                    error: "Este usuario ya está registrado en el sistema.",
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const token = sign({ uo: uo }, jwtSecret, { expiresIn: "1h" });
            const validationUrl = `http://localhost:5001/usuarios/validate/${token}`;
            const shortUrl = await getShortenedUrl(validationUrl);
            // Usuario existente, actualizar la contraseña y estado
            await Usuarios.update(
                { password: hashedPassword, estado: "Pendiente" },
                { where: { uo: uo } }
            );

            const mailOptions = {
                from: "MiAreaPersonal@outlook.com",
                to: "uo277476@uniovi.es",
                // to: user.email,
                subject: "Validación de cuenta",
                text: `Haz clic en el siguiente enlace para validar tu cuenta: ${shortUrl}`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.status(500).json({
                        error: "Error al enviar el correo de validación",
                    });
                }
                return res
                    .status(200)
                    .json({ message: "Correo de validación enviado" });
            });
        }
    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// Ruta para la validación del usuario
router.get("/validate/:token", async (req, res) => {
    const { token } = req.params;

    try {
        // Verificar y decodificar el token
        const decoded = verify(token, jwtSecret);
        console.log("Decoded: ", decoded);
        const { uo } = decoded;
        console.log("UO: ", uo);

        // Obtener el usuario
        //const usuario = await Usuarios.findOne({ where: { uo: uo } });

        // Actualizar el estado del usuario a "Activa"
        await Usuarios.update({ estado: "Activa" }, { where: { uo: uo } });

        // Crear eventos para el usuario
        // if (usuario.uo.startsWith("UO")) {
        //     await createEventsForUser(uo);
        // }

        // Responder al usuario con un mensaje de éxito
        res.status(200).send(
            "Cuenta activada correctamente. Ahora puedes iniciar sesión."
        );
    } catch (error) {
        console.error("Error verifying token: ", error); // Log the error
        // Manejar errores de token inválido o caducado
        if (error.name === "TokenExpiredError") {
            res.status(400).send(
                "El token ha expirado. Por favor, solicita un nuevo enlace."
            );
        } else if (error.name === "JsonWebTokenError") {
            res.status(400).send(
                "Token inválido. Por favor, solicita un nuevo enlace."
            );
        } else {
            res.status(500).send(
                "Error en el servidor. Por favor, intenta nuevamente más tarde."
            );
        }
    }
});

async function createEventsForUser(uo) {
    try {
        // Obtener el usuario
        const usuario = await Usuarios.findOne({ where: { uo: uo } });

        if (!usuario) {
            console.log(`No se encontró el usuario con UO: ${uo}`);
            return;
        }

        console.log("Usuario: ", usuario);

        // Coger todas las matrículas de ese usuario
        const matriculas = await Matriculas.findAll({
            where: { UsuarioId: usuario.id, ver: true },
            attributes: ["GrupoId"],
        });

        console.log("Matrículas: ", matriculas);

        if (!matriculas || matriculas.length === 0) {
            console.log(`No se encontraron matrículas para el usuario: ${uo}`);
            return;
        }

        // Coger todos los gruposId de esas matrículas
        const grupoIds = matriculas.map((matricula) => matricula.GrupoId);

        // Obtener todas las sesiones de esos grupoIds
        const sesiones = await Sesiones.findAll({
            where: { GrupoId: { [Op.in]: grupoIds } },
        });

        if (!sesiones || sesiones.length === 0) {
            console.log(
                `No se encontraron sesiones para los grupos: ${grupoIds}`
            );
            return;
        }

        // Crear el evento para cada sesión
        const eventos = sesiones.map((sesion) => {
            // Crear un objeto evento copiando todos los campos de la sesión excepto GrupoId, y agregando UsuarioId
            const { id, GrupoId, ...eventoData } = sesion.toJSON();
            return {
                ...eventoData,
                eliminado: false,
                eliminadoPorUsuario: false,
                UsuarioId: usuario.id,
            };
        });

        const tamañoLote = 100; // Tamaño del lote
        let nEventosNuevos = 0;
        // Dividir los eventos en lotes
        for (let i = 0; i < eventos.length; i += tamañoLote) {
            const lote = eventos.slice(i, i + tamañoLote);
            // Agregar los eventos que no existan
            const response = await axios.post(
                `http://localhost:5001/eventos/addLoteEventos`,
                lote
            );

            nEventosNuevos = response.data.nEventosAgregados + nEventosNuevos;
        }

        if (nEventosNuevos === 0) {
            console.log(
                `Todos los eventos ya estaban creados para el usuario: ${uo}`
            );
        } else {
            console.log(`Eventos creados correctamente para el usuario: ${uo}`);
        }
    } catch (error) {
        console.error(`Error creando eventos para el usuario: ${uo}`, error);
    }
}

router.post("/", async (req, res) => {
    const { uo, password, profesor, estado } = req.body;

    try {
        // Generar el hash de la contraseña
        const hash = await bcrypt.hash(password, 10);

        // Crear el usuario en la base de datos
        await Usuarios.create({
            uo: uo,
            password: hash,
            email: `${uo}@uniovi.es`,
            admin: 0,
            profesor: profesor,
            estado: estado,
        });

        // Enviar respuesta al cliente
        res.json({ message: "Usuario creado exitosamente." });
    } catch (error) {
        console.error("Error al crear usuario:", error);
        res.status(500).json({
            error: "Error interno del servidor al crear usuario.",
        });
    }
});

router.post("/login", async (req, res) => {
    const { uo, password } = req.body;

    try {
        const user = await Usuarios.findOne({ where: { uo: uo } });

        if (!user) return res.json({ error: "No existe este usuario" });

        // Verificar el estado de la cuenta del usuario
        if (user.estado !== "Activa") {
            return res.json({
                error: "La cuenta de este usuario no está activa. Regístrate.",
            });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.json({
                error: "Usuario o contraseña erróneos",
            });
        }

        const accessToken = sign(
            {
                uo: user.uo,
                id: user.id,
                admin: user.admin,
                email: user.email,
                profesor: user.profesor,
                estado: user.estado,
            },
            "importantsecret"
        );

        // Crear eventos para el usuario
        if (user.uo.startsWith("UO")) {
            await createEventsForUser(uo);
        }

        return res.json({
            token: accessToken,
            uo: uo,
            id: user.id,
            admin: user.admin,
            email: user.email,
            profesor: user.profesor,
            estado: user.estado,
        });
    } catch (error) {
        console.error("Error durante el proceso de inicio de sesión: ", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

router.get("/auth", validateToken, (req, res) => {
    res.json(req.user);
});

router.post("/crearadmin", async (req, res) => {
    const { uo, password } = req.body;
    const profesor = 0;
    const estado = "Inactiva";

    try {
        // Verificar si ya existe un administrador con el mismo UO
        const existingAdmin = await Usuarios.findOne({ where: { uo: uo } });
        if (existingAdmin) {
            // Si ya existe, devolver un error
            return res.status(400).json({
                error: "Ya existe un administrador con este UO",
            });
        }

        // Si no existe, proceder con la creación del administrador
        const hash = await bcrypt.hash(password, 10);
        await Usuarios.create({
            uo: uo,
            password: hash,
            email: `${uo}@uniovi.es`,
            admin: 1,
            profesor: profesor,
            estado: estado,
        });
        res.json("SUCCESS");
    } catch (error) {
        res.status(500).json({
            error: "Hubo un error al crear el administrador",
        });
    }
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const user = await Usuarios.findByPk(id);

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        return res.json({ uo: user.uo });
    } catch (error) {
        console.error("Error al buscar el usuario:", error);
        return res.status(500).json({ error: "Error del servidor" });
    }
});

router.get("/allUsers/all", async (req, res) => {
    try {
        // Obtener todos los usuarios de la base de datos
        const usuarios = await Usuarios.findAll();

        // Mapear los usuarios para obtener solo el ID y el nombre
        const usuariosConNombre = usuarios.map((usuario) => {
            return {
                id: usuario.id,
                uo: usuario.uo,
                email: usuario.email,
                admin: usuario.admin,
                profesor: usuario.profesor,
                estado: usuario.estado,
            };
        });

        // Responder con la lista de usuarios y sus IDs
        res.json(usuariosConNombre);
    } catch (error) {
        console.error("Error al obtener todos los usuarios:", error);
        res.status(500).json({
            error: "Error del servidor al obtener usuarios",
        });
    }
});

// Ruta para crear múltiples usuarios a partir de un array de UOs
router.post("/addLoteUsuarios/alumnos/inactivos", async (req, res) => {
    const usuarios = req.body;
    const usuariosCreados = [];
    const usuariosExistentes = [];

    // Verificar que 'usuarios' es un array de objetos que contienen 'uo'
    if (
        !Array.isArray(usuarios) ||
        !usuarios.every((usuario) => typeof usuario.uo === "string")
    ) {
        return res.status(400).json({
            error: "El input debe ser un array de objetos que contienen 'uo'",
        });
    }

    try {
        for (const usuario of usuarios) {
            const { uo } = usuario;

            // Verificar si el usuario ya existe
            const usuarioExistente = await Usuarios.findOne({ where: { uo } });
            if (!usuarioExistente) {
                // Hashear la contraseña
                const hashedPassword = await bcrypt.hash("pass", 10);

                // Crear el usuario
                const nuevoUsuario = await Usuarios.create({
                    uo: uo,
                    password: hashedPassword,
                    email: `${uo}@uniovi.es`,
                    admin: false,
                    profesor: false,
                    estado: "Inactiva",
                });

                usuariosCreados.push(nuevoUsuario);
            } else {
                usuariosExistentes.push(usuarioExistente);
            }
        }

        // Obtener todos los usuarios después de crear los nuevos
        const todosLosUsuarios = await Usuarios.findAll();

        console.log("Usuarios creados exitosamente: ", usuariosCreados.length);
        return res.status(201).json({
            message: "Usuarios creados exitosamente",
            usuariosCreados,
            usuariosExistentes,
            todosLosUsuarios,
        });
    } catch (error) {
        console.error("Error al crear los usuarios:", error);
        return res
            .status(500)
            .send("Error interno del servidor al crear los usuarios");
    }
});

router.put("/changePassword", async (req, res) => {
    const { uo, newPassword } = req.body;

    try {
        // Validar que la nueva contraseña sea válida
        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({
                error: "La contraseña debe tener al menos 4 caracteres",
            });
        }

        // Generar el hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar la contraseña en la base de datos
        const updatedUser = await Usuarios.update(
            { password: hashedPassword },
            { where: { uo: uo } }
        );

        if (updatedUser[0] === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.status(200).json({
            message: "Contraseña actualizada exitosamente",
        });
    } catch (error) {
        console.error("Error al cambiar la contraseña:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;
