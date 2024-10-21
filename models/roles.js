module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define('role', {
        name: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        description: DataTypes.STRING,
        createdBy: DataTypes.INTEGER,
        updatedBy: DataTypes.INTEGER,
        deleted: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
    })

    Role.associate = function (models) {
       
        Role.hasMany(models.user_roles, {
            foreignKey: 'roleId',
            as: 'userRole',
        })
    }

    return Role
}
