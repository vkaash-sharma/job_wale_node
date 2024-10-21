module.exports = (sequelize, DataTypes) => {
    const userSkillsInterest = sequelize.define('user_skills_or_interests', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        type : {
            type: DataTypes.STRING ,
        } ,
        reference_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
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

   
    userSkillsInterest.associate =  function(model) {
        userSkillsInterest.belongsTo(model.users , {
            foreignKey: 'userId' ,
            as:"userSkill"
        })


        userSkillsInterest.belongsTo(model.masterDropdowns , {
            foreignKey: 'reference_id' ,
            as:"skillInterest"
        })
    }


    return userSkillsInterest;
}
