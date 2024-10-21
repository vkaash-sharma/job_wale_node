module.exports = (sequelize, DataTypes) => {
    const opportunitySkills = sequelize.define('opportunities_skills_interest_locations', {
        opportunity_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isInt: true,
            },
        },
        type : {
            type: DataTypes.STRING ,
        } ,
        reference_id: {
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

    opportunitySkills.associate =  function(model) {
        opportunitySkills.belongsTo(model.opportunities , {
            foreignKey: 'opportunity_id' ,
            as:"opportunitySkill"
        }),

        opportunitySkills.belongsTo(model.masterDropdowns , {
            foreignKey: 'reference_id' ,
            as:"skill"
        })
        
    }


    return opportunitySkills
}
