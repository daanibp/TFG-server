module.exports = (sequelize, DataTypes) => {
    const Grupo = sequelize.define("Grupo", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tipo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        AsignaturaId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    });

    Grupo.associate = (models) => {
        Grupo.hasMany(models.Sesiones, {
            onDelete: "cascade",
        });
    };

    return Grupo;
};
