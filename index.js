const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(express.json());
//app.use(cors());

const allowedOrigins = [
    "https://https://blue-moss-0c93d7110.5.azurestaticapps.net/",
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) === -1) {
                const msg =
                    "El CORS policy no permite el acceso desde el origen especificado.";
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        methods: "GET,POST,PUT,DELETE",
        allowedHeaders: "Content-Type,Authorization",
    })
);

const db = require("./models");

const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "10000mb" }));

// Routers
const usuariosRouter = require("./routes/Usuarios");
app.use("/usuarios", usuariosRouter);
const eventosRouter = require("./routes/Eventos");
app.use("/eventos", eventosRouter);
const eventosGlobalesRouter = require("./routes/EventosGlobales");
app.use("/eventosglobales", eventosGlobalesRouter);
const solicitudEventosRouter = require("./routes/SolicitudEvento");
app.use("/solicitudEventos", solicitudEventosRouter);
const MatriculasRouter = require("./routes/Matriculas");
app.use("/matriculas", MatriculasRouter);
const AsignaturasRouter = require("./routes/Asignaturas");
app.use("/asignaturas", AsignaturasRouter);
const GrupoRouter = require("./routes/Grupo");
app.use("/grupos", GrupoRouter);
const SesionesRouter = require("./routes/Sesiones");
app.use("/sesiones", SesionesRouter);
const EventosCompartidosRouter = require("./routes/EventosCompartidos");
app.use("/eventoscompartidos", EventosCompartidosRouter);
const Notificaciones = require("./routes/Notificaciones");
app.use("/notificaciones", Notificaciones);
const NotificacionesGlobales = require("./routes/NotificacionesGlobales");
app.use("/notificacionesglobales", NotificacionesGlobales);

//app.get("/validate/:token");

const port = process.env.PORT || 5001;

db.sequelize
    .sync()
    .then(() => {
        app.listen(port, () => {
            console.log("Server running on port " + port);
        });
    })
    .catch((err) => {
        console.log(err);
    });
