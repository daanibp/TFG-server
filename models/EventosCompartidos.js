module.exports = (sequelize, DataTypes) => {
    const EventosCompartidos = sequelize.define("EventosCompartidos", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        UsuarioId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Usuarios",
                key: "id",
            },
        },
        EventoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Eventos",
                key: "id",
            },
        },
        UsuarioCreadorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Usuarios",
                key: "id",
            },
        },
    });

    EventosCompartidos.associate = (models) => {
        EventosCompartidos.belongsTo(models.Usuarios, {
            foreignKey: "UsuarioId",
            as: "usuarioCompartido",
        });

        EventosCompartidos.belongsTo(models.Usuarios, {
            foreignKey: "UsuarioCreadorId",
            as: "usuarioCreador",
        });

        EventosCompartidos.belongsTo(models.Eventos, {
            foreignKey: "EventoId",
            as: "evento",
        });

        EventosCompartidos.hasMany(models.Notificaciones, {
            foreignKey: "EventosCompartidoId",
            onDelete: "cascade",
            as: "notificaciones",
        });
    };

    return EventosCompartidos;
};
