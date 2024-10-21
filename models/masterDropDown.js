module.exports = (sequelize, DataTypes) => {
    const masterDropdownsList = sequelize.define('masterDropdowns', {
        name : {
            type: DataTypes.STRING ,
        } ,
        type : {
            type: DataTypes.STRING ,
        } ,
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
            // validate: {
            //     isInt: true,opportunitySkill
            // },
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

   
    masterDropdownsList.associate =  function(model) {
        masterDropdownsList.hasMany(model.user_skills_or_interests , {
            foreignKey: 'reference_id' ,
            as:"userSKillInterest"
        })

        masterDropdownsList.hasMany(model.opportunities_skills_interest_locations , {
            foreignKey: 'reference_id' ,
            as:"opskill"
        })
    }

    return masterDropdownsList;
}