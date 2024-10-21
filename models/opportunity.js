module.exports = (sequelize, DataTypes) => {
  const opportunity = sequelize.define("opportunities", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    opportunity_name: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    opportunity_desc: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    recruit_start: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    recruit_end: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    project_start: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    project_end: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    engagement_type : {
      type: DataTypes.STRING(64),
      allowNull: false,
    } ,
    emg_opportunity: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    commit_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sent_status : {
      type: DataTypes.TINYINT,
      defaultValue : 0
    } ,
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      allowNull: false,
    },
  });

    opportunity.associate = function (models) {
      opportunity.belongsTo(models.users, {
        foreignKey: "userId",
        as: "user",
      });

      opportunity.hasMany(models.opportunities_skills_interest_locations, {
        foreignKey: "opportunity_id",
        as: "opportunitySkill",
      });
      
        opportunity.hasMany(models.opportunities_applies, {
          foreignKey: "opportunity_id",
          as: "opportunitiesAppliedData",
        });

        opportunity.hasMany(models.opportunities_assigned_with_feedbacks, {
          foreignKey: "opportunity_id",
          as: "opportunityFeedbackStatus",
        });
      
    };

  return opportunity;
};
