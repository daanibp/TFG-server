module.exports = (sequelize, DataTypes) => {
    const Matriculas = sequelize.define("Matriculas", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        ver: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        UsuarioId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        AsignaturaId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        GrupoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    });

    Matriculas.associate = (models) => {
        Matriculas.belongsTo(models.Grupo, {
            foreignKey: "GrupoId",
        });
        Matriculas.belongsTo(models.Usuarios, {
            foreignKey: "UsuarioId",
        });
        Matriculas.belongsTo(models.Asignaturas, {
            foreignKey: "AsignaturaId",
        });
    };

    return Matriculas;
};
