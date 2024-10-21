const phoneValidationRegex = /\d{3}-\d{3}-\d{4}/;
const model = require("./index");
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("users", {
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,

    email: {
      type: DataTypes.STRING,
    },
    password: DataTypes.STRING,
    mobile: {
      type: DataTypes.STRING,
      // validate: {
      //   validateMobile: function (value) {
      //     if (
      //       !/^(13|14|15|17|18)\d{9}$/i.test(value) &&
      //       !/^((\(\d{2,3}\))|(\d{3}\-)|(\d{3}))?(\(0\d{2,3}\)|0\d{2,3}-)?[1-9]\d{6,7}(\-\d{1,4})?$/i.test(
      //         value
      //       )
      //     ) {
      //       throw new Error("mobile format error!");
      //     }
      //   },
      // },
    },
    profilePicture: DataTypes.STRING,
    isDefaultPassword: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    isCompleted: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      allowNull: false,
    },
    isSkipped: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      allowNull: false,
    },
    activeStatus: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      allowNull: true,
      validate: {
        isInt: true,
      },
    },
    profile_desc: {
      type: DataTypes.STRING,
    },
    profile_title: {
      type: DataTypes.STRING,
    },
    time_availability: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    email_verify: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    verification_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isTwoFactorAuth: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      allowNull: true,
      validate: {
        isInt: true,
      },
    },
    createdBy: {
      type: DataTypes.INTEGER,
    },
    updatedBy: DataTypes.INTEGER,
    deleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  });

  // make realtion with others table=====>

  User.associate = function (model) {
    User.hasOne(model.user_roles, {
      foreignKey: "userId",
      as: "userRole",
    });

    User.hasOne(model.opportunities, {
      foreignKey: "userId",
      as: "opportunities",
    });



    User.hasMany(model.user_skills_or_interests, {
      foreignKey: "userId",
      as: "userSkill",
    });

    User.hasMany(model.opportunities_assigned_with_feedbacks, {
      foreignKey: "userId",
      as: "userFeedbackDetails",
    });

    // User.hasMany(model.opportunities_assigned_with_feedbacks, {
    //   foreignKey: "review_by_id",
    //   as: "userReviewBy",
    // });
    User.hasMany(model.opportunities_applies, {
      foreignKey: "userId",
      as: "opportunityApplied",
    });


    User.hasMany(model.opportunities_assigned_with_feedbacks, {
      foreignKey: "userId",
      as: "userDetails",
    });


    User.hasMany(model.opportunities_assigned_with_feedbacks, {
      foreignKey: "manager_id",
      as: "managerDetails",
    });

  };


  // to delete user some key from return model
  User.prototype.toJSON = function () {
    let values = Object.assign({}, this.get());
    delete values.userKey;
    delete values.password
    return values;
  };

  return User;
};
