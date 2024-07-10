module.exports = (sequelize, DataTypes) => {
    const Usuarios = sequelize.define("Usuarios", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        uo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        admin: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        profesor: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    });

    Usuarios.associate = (models) => {
        Usuarios.hasMany(models.Eventos, {
            onDelete: "cascade",
        });
        Usuarios.hasMany(models.SolicitudEvento, {
            onDelete: "cascade",
        });
        Usuarios.hasMany(models.Matriculas, {
            onDelete: "cascade",
        });
    };

    return Usuarios;
};
