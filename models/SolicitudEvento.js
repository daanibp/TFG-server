module.exports = (sequelize, DataTypes) => {
    const SolicitudEvento = sequelize.define("SolicitudEvento", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        asunto: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fechaDeComienzo: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        comienzo: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        fechaDeFinalización: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        finalización: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        todoElDía: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        reminder: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        reminderDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        reminderTime: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        meetingOrganizer: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        requiredAttendees: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        optionalAttendees: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        recursosDeLaReunión: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        billingInformation: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        categories: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        mileage: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        priority: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        private: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        sensitivity: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        showTimeAs: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        UsuarioId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    });

    SolicitudEvento.associate = (models) => {
        SolicitudEvento.belongsTo(models.Usuarios, {
            foreignKey: "UsuarioId",
            as: "usuarioCreador",
        });
        SolicitudEvento.hasOne(models.EventosGlobales, {
            foreignKey: "SolicitudEventoId",
            as: "eventoGlobal",
        });
        SolicitudEvento.hasMany(models.NotificacionesGlobales, {
            foreignKey: "SolicitudEventoId",
            onDelete: "cascade",
            as: "notificacionesGlobales",
        });
    };

    return SolicitudEvento;
};
