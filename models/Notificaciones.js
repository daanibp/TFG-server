module.exports = (sequelize, DataTypes) => {
    const Notificaciones = sequelize.define("Notificaciones", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        vista: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        EventosCompartidoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    });

    Notificaciones.associate = (models) => {
        Notificaciones.belongsTo(models.EventosCompartidos, {
            foreignKey: "EventosCompartidoId",
            as: "eventoCompartido",
        });
    };

    return Notificaciones;
};
