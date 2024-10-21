module.exports = (sequelize, DataTypes) => {
  const opportunityApplied = sequelize.define("opportunities_applies", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    opportunity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    opp_status: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
    },
    opp_type: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    project_start: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    project_end: {
      type: DataTypes.DATE,
      allowNull: false,
    },
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


  opportunityApplied.associate = function (models) {

    opportunityApplied.belongsTo(models.users, {
        foreignKey: "userId",
        as: "user",
      });
      opportunityApplied.belongsTo(models.opportunities, {
      foreignKey: "opportunity_id",
      as: "opportunityDetails",
    });
  };


  return opportunityApplied;
};
