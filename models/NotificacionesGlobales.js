module.exports = (sequelize, DataTypes) => {
    const NotificacionesGlobales = sequelize.define("NotificacionesGlobales", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        vista: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        SolicitudEventoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    });

    NotificacionesGlobales.associate = (models) => {
        NotificacionesGlobales.belongsTo(models.SolicitudEvento, {
            foreignKey: "SolicitudEventoId",
            as: "solicitudEvento",
        });
    };

    return NotificacionesGlobales;
};
