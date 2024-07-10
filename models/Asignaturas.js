module.exports = (sequelize, DataTypes) => {
    const Asignaturas = sequelize.define("Asignaturas", {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
        },
        idAsignatura: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        curso: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        nombreReal: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        nombreHorario: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        nombreExamen: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        nombreAsignación: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    });

    Asignaturas.associate = (models) => {
        Asignaturas.hasMany(models.Grupo, {
            onDelete: "cascade",
        });
    };

    Asignaturas.associate = (models) => {
        Asignaturas.hasMany(models.Matriculas, {
            onDelete: "cascade",
        });
    };

    return Asignaturas;
};
