module.exports = (sequelize, DataTypes) => {
    const userRole = sequelize.define('user_roles', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isInt: true,
            },
        },
        roleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isInt: true,
            },
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                isInt: true,
            },
        },
        updatedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                isInt: true,
            },
        },
        deleted: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
            validate: {
                isInt: true,
            },
        },
    })

    userRole.associate = function (models) {
        userRole.belongsTo(models.users, {
            foreignKey: 'userId',
            as: 'user',
        })
        userRole.belongsTo(models.role, {
            foreignKey: 'roleId',
            as: 'role',
        })
    }

    return userRole
}
