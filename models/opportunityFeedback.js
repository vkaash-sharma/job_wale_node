module.exports = (sequelize, DataTypes) => {
    const opportunityFeedback = sequelize.define('opportunities_assigned_with_feedbacks', {
        opportunity_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isInt: true,
            },
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isInt: true,
            },
        },
        user_review : {
            type: DataTypes.STRING ,
        } ,
        user_review_desc : {
            type: DataTypes.STRING ,
        } ,
        user_review_time : {
            type: DataTypes.DATE,
        } ,
        user_star_rating : {
            type: DataTypes.INTEGER,
        } ,
        user_review_status : {
            type: DataTypes.INTEGER,
            defaultValue : 0
        } ,
        manager_id : {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isInt: true,
            }, 
        } ,
        manager_review : {
            type: DataTypes.STRING ,
        } ,
        manager_review_desc : {
            type: DataTypes.STRING , 
        } ,
        manager_review_time : {
            type: DataTypes.DATE,
        } ,
        manager_star_rating : {
            type: DataTypes.INTEGER, 
        } ,
        manager_review_status : {
            type: DataTypes.INTEGER,
            defaultValue : 0
        } ,
        feedback_desc : {
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

   


    opportunityFeedback.associate = function (models) {
         opportunityFeedback.belongsTo(models.users , {
            foreignKey : 'userId' ,
            as : 'userDetails'
         })
          

         opportunityFeedback.belongsTo(models.opportunities , {
            foreignKey : 'opportunity_id' ,
            as : 'opportunityIdFeedback'
         })

         opportunityFeedback.belongsTo(models.users , {
            foreignKey : 'manager_id' ,
            as : 'managerDetails'
         })
        
       
      };

    return opportunityFeedback;
}
