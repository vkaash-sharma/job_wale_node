const models = require("../models");
const clog = require("../services/ChalkService");
const CommonService = require("../services/CommonService");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const {SaveEventService} = require("../services/events.service");
const EVENTS_CONSTANTS = require("../config/events.config");
const URL_CONFIG = require("../config/urls.config");
const {GenerateVerifyUrl, editUserValidation} = require("../services/users.service");
const {changePasswordValidation} = require('../services/users.service');
const {CREATED, UPDATE} = require("../config/action.config");
const {checkTheValidUser} = require("../services/auth.service");
// const UserService = require('../services/users.service')

// get user by its id ============>
exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    let options = {
      where: {
        id: id,
        deleted: 0,
      },
      attributes: [
        "id",
        "firstName",
        "lastName",
        "profilePicture",
        "time_availability",
        "profile_desc",
        "profile_title",
      ],
      include: [
        {
          required: false,
          association: "userSkill",
          where: {
            deleted: 0,
          },
          include: [
            {
              association: "skillInterest",
            },
          ],
        },
      ],
    };
    const result = await models.users.findOne(options);
    if (result) {
      return res.send({
        status: 1,
        message: req.__("success"),
        data: result,
      });
    } else {
      return res.send({
        status: 0,
        message: req.__("No records found"),
      });
    }
  } catch (error) {
    await CommonService.filterError(error, req, res);
  }
};

//  login the valid user=====>
exports.login = async (req, res) => {
  try {
    let {email, password} = req.body;
    // clog.success(email, password);
    if (!isValidEmailFormat(email)) {
      return res.json({
        status: 0,
        message: {username: req.__("Invalid email format")},
      });
    }
    let options = {
      where: {
        email: email,
        deleted: 0,
      },
      include: [
        {
          required: false,
          association: "userRole",
          include: [{association: "role"}],
        },
        {
          required: false,
          association: "userSkill",
          where: {
            deleted: 0,
          },
          include: [
            {
              association: "skillInterest",
            },
          ],
        },
      ],
    };

    const user = await models.users.findOne(options);
    // validate the password the entered password
    if (!user) {
      return res.json({
        status: 0,
        message: {username: req.__("User Name does not exist")},
      });
    }
    const validPassword = await validatePassword(password, user.password);
    if (!validPassword) {
      return res.json({
        status: 0,
        message: {password: req.__("Please enter a valid password.")},
      });
    }
    // Check if user verified email or not
    if (+user.email_verify !== 1) {
      return res.status(200).json({
        status: 0,
        message: {username: req.__('Account is not verified. Please verify your account using the link sent to your email address.')}
      })
    }
    let JWT_SECRET = process.env.JWT_SECRET;
    const token = jwt.sign(
      {email: user.email, userId: user.id.toString()},
      JWT_SECRET,
      {expiresIn: "16d"}
    );

    if (user) {
      const updateUser = {...user.dataValues};
      delete updateUser.password;
      return res.send({
        status: 1,
        message: req.__("Login Successful."),
        data: {
          ...updateUser,
          token: token,
        },
      });
    } else {
      return res.send({
        status: 0,
        message: req.__("Please enter correct Details."),
      });
    }
  } catch (error) {
    CommonService.filterError(error, req, res);
  }
};

// get the logged user ======>
exports.getLoggedUser = async (req, res) => {
  const userId = req.userId;
  try {
    const user = await models.users.findOne({
      where: {
        id: userId,
      },
      attributes: [
        "id",
        "firstName",
        "lastName",
        "profilePicture",
        "time_availability",
        "profile_desc",
        "profile_title",
        "isCompleted",
        "isSkipped"
      ],
      include: [
        {association: "userRole", include: [{association: "role"}]},
        {
          required: false,
          association: "userSkill",
          where: {
            deleted: 0,
          },
          include: [
            {
              association: "skillInterest",
            },
          ],
        },
      ],
    });

    if (user) {
      return res.send({
        status: 1,
        message: "success",
        data: {
          ...user.dataValues,
        },
      });
    } else {
      return res.send({
        status: 0,
        message: "not found",
      });
    }
  } catch (error) {
    await CommonService.filterError(error, req, res);
  }
};

//  Edit User By its Id====================>
exports.EditUserById = async (req, res) => {
  try {
    const id = req.userId;
    const {form} = req.body;
    let {
      firstName,
      lastName,
      profile_desc,
      profile_title,
      interests,
      skills,
      locations,
      time_availability,
    } = form;

    let options = {
      where: {
        id: id,
        deleted: 0,
      },
    };

    let userOptions = {
      where: {
        id: id,
        deleted: 0,
      },
      attributes: [
        "id",
        "firstName",
        "lastName",
        "profilePicture",
        "email",
        "profile_desc",
        "profile_title",
      ],
    };
    
    let actionLogOption = {
         id : req?.user?.id
    }
    // add validation for the edit user
    let {status , message} = await editUserValidation(form);
    if(!status) {
      return CommonService.ResponseMessage(status , message, res);
    }
    let result = await models.users.findOne(options);
    if (result) {
      // make the actionLog for edit user=======>
      actionLogOption = await CommonService.actionLogs(
        "EDIT_USER_PROFILE",
         id,
        UPDATE,
        actionLogOption,
        req?.user?.id,
        req,
        res
      )
      firstName = await CommonService.trimResponse(firstName);
      lastName = await CommonService.trimResponse(lastName);
      await result.update(
        {
          profile_desc: profile_desc,
          time_availability: time_availability,
          firstName: firstName,
          lastName: lastName,
          profile_title: profile_title,
          isDefaultPassword: 1,
          isCompleted: 1,
          isSkipped: 1,
          updatedBy: req?.userId
        },
        actionLogOption 
      );
      // enter the change log for the skills and the interest=====>
      let userSkillOrInterest = await models.user_skills_or_interests.update(
        {deleted: 1 , updatedBy : req?.user?.id },
        {
          where: {
            userId: id,
            deleted : 0
          },
          id : req?.user?.id ,
          actionLogId : actionLogOption.actionLogId,
          individualHooks: true,
        }
      );
      
      let newSKillInterest = [];

      //  insert the new interest for the employee by deleting the old one...
      // console.log("checking" , interest , skills)
      if (interests && interests.length > 0) {
        interests.forEach((interest) => {
          newSKillInterest.push({
            userId: id,
            type: "interest",
            createdBy : req?.user?.id ,
            reference_id: interest,
            deleted: 0,
          });
        });
      }

      // insert the new skills

      if (skills && skills.length > 0) {
        skills.forEach((skill) => {
          newSKillInterest.push({
            userId: id,
            type: "skill",
            reference_id: skill,
            createdBy : req?.user?.id ,
            deleted: 0,
          });
        });
      }

      // insert the new locations ===========>

      if (locations && locations.length > 0) {
        locations.forEach((location) => {
          newSKillInterest.push({
            userId: id,
            type: "location",
            reference_id: location,
            createdBy : req?.user?.id ,
            deleted: 0,
          });
        });
      }

      if (newSKillInterest.length > 0) {
        const userSkillInterestResponse = await models.user_skills_or_interests.bulkCreate(newSKillInterest);
      }


      // const userData = await models.users.findOne(userOptions);

      return res.send({
        status: 1,
        data: result,
        message: req.__("Profile Saved"),
      });    
    } else {
      return res.send({
        status: 0,
        message: req.__("No records found"),
      });
    }
  } catch (error) {
    await
     CommonService.filterError(error, req, res);
  }
};

// upload the image using multer

exports.uploadProfileImage = async (req, res) => {
  try {
    const fileDetails = req?.file;
    const userId = req.user.id;
    let actionLogOption ={id : req?.user?.id}
    let options = {
      where: {
        id: userId,
        deleted: 0,
      },
    };
    if (fileDetails) {
      let UrlPath = process.env.API_URL || "http://localhost:3012/";
      const imagePath = UrlPath + `public/upload/` + fileDetails.filename;
      const updateUserProfileImage = await models.users.findOne(options);
   
      if (updateUserProfileImage) {
        actionLogOption = await CommonService.actionLogs(
          "EDIT_USER_PROFILE_image",
          userId,
          UPDATE,
          actionLogOption,
          req?.user?.id,
          req,
          res
        )
        await updateUserProfileImage.update(
          {
            profilePicture: imagePath,
          },
          actionLogOption
        );
        return res.send({
          status: 1,
          message: req.__("Upload Successfully."),
        });
      } else {
        return res.send({
          status: 0,
          message: req.__("something went wrong!"),
        });
      }
    }
  } catch (error) {
    clog.error(error)
    await CommonService.filterError(error, req, res);
  }
};

// CHANGE USER PASSWORD API ========================>
exports.changeUserPassword = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const {oldPassword, password, confirmPassword} = req.body;
    let actionLogOption = {id : req?.user?.id}
    /* ===========check wheather the oldPassword is not similar with the old password;
     if password is not same as the confirm passwor logout ============== */
    const {status, message} = await changePasswordValidation(oldPassword, password, confirmPassword);
    if (!status) {
      return res.json({
        status: status,
        message: message
      })
    }
    let user = await models.users.findOne({where: {id: userId}});
    if (user) {
      const validPassword = await bcryptjs.compare(oldPassword, user.password);
      if (!validPassword) {
        return res.json({
          status: 0,
          message: "Old Password is not correct",
        });
      }
      const hashedPassword = await bcryptjs.hash(password, 12);
      actionLogOption = await CommonService.actionLogs(
        "change-password",
        user.id,
        UPDATE,
        actionLogOption,
        req?.user?.id,
        req,
        res
      )
      await user.update({
        password: hashedPassword,
        updatedBy : req?.user?.id ,
        isDefaultPassword: 1,
      },actionLogOption);
      return res.status(200).json({
        status: 1,
        data: null,
        message: "User has been updated",
      });
    }
  } catch (error) {
    await CommonService.filterError(error, req, res);
  }
};


// validate password function=========>
async function validatePassword(plainPassword, hashedPassword) {
  
  return await bcryptjs.compare(plainPassword, hashedPassword);
}


// ENDORSEMENT FOR A EMPLOYEE===================>
exports.getEndorsementForUser = async (req, res) => {
  try {
    const applicantId = req?.params?.id;
    let userSkills = [];
    let options = {
      where: {
        id: applicantId,
        deleted: 0,
      },
      attributes: [
        "id",
        "firstName",
        "lastName",
        "profilePicture",
        "time_availability",
        "profile_desc",
        "profile_title",
      ],
      include: [
        {
          required: false,
          association: "userSkill",
          where: {
            deleted: 0,
          },
          include: [
            {
              association: "skillInterest",
            },
          ],
        },
      ],
    };
    let user = await models.users.findOne(options);
    let getTodayDate = CommonService.generateTodaysDate();
    // if we have the applicant id
    if (user?.userSkill && user?.userSkill?.length > 0) {
      // Filter the skills from user.userSkill with 'type' as 'skill'
      userSkills = user.userSkill
        .filter((skill) => skill.type === "skill")
        .map((skill) => skill?.skillInterest?.name);
    }
    //  get the completed opportunity
    const getOppSkillQuery = `SELECT DISTINCT op.id , op.opportunity_name , op.project_end, JSON_ARRAYAGG( md.name ) AS skilName FROM opportunities AS op LEFT JOIN opportunities_applies as oa ON oa.opportunity_id=op.id AND oa.userId=:id JOIN opportunities_skills_interest_locations AS osil ON osil.opportunity_id=op.id JOIN masterDropdowns AS md ON md.id = osil.reference_id WHERE op.project_end < :date AND op.deleted = 0 AND osil.deleted = 0 AND md.type="skill" AND oa.deleted=0 AND oa.opp_status=1 GROUP BY op.id;`;

    let replacements = {
      date: getTodayDate,
      id: applicantId,
    };
    //  let skill count occurance=========>
    // user skill count=====================>
    let skillCounts = {};
    //  to get the userSkill in this
    // userSkills.forEach((userSkill) => {
    //   skillCounts[userSkill] = 0;
    // });

    let getOppSkill = await models.sequelize.query(getOppSkillQuery, {
      replacements,
      type: models.Sequelize.QueryTypes.SELECT,
      raw: true,
    });
    //  let skill count occurance=========>
    // user skill count=====================>
    // userSkills.forEach((userSkill) => {
    //   skillCounts[userSkill] = 0;
    // });

    // put the opportunity skillcount
    if (getOppSkill.length > 0) {
      getOppSkill?.forEach((opp) => {
        opp.skilName.forEach((skill) => {
          if (skill in skillCounts) {
            skillCounts[skill]++;
          } else {
            skillCounts[skill] = 1;
          }
        });
      });
      return res.send({
        message: "success",
        status: 1,
        data: skillCounts,
      });
    } else {
      return res.json({
        message: "No Endorsement.",
        status: 0
      })
    }
  } catch (error) {
    await CommonService.filterError(error, req, res);
  }
};



// REGISTER THE NEW EMPLOYEE==============>
exports.postNewEmployee = async (req, res) => {
  try {
    let {
      firstName,
      lastName,
      email,
      password,
    } = req?.body;
    // enter the valid email format
    if (!isValidEmailFormat(email)) {
      return res.json({
        status: 0,
        message: {username: req.__("Invalid email format")},
      });
    }

    // check wheather the email is valid or not=======>
    // const {status, message} = await checkTheValidUser(email);
    // if (!status) {
    //   return res.json({
    //     status: status,
    //     message: message
    //   })
    // }

    const checkEmailExists = await models.users.findOne({
      where: {email: email, deleted: 0},
    });
    if (checkEmailExists) {
      return res.json({
        status: 0,
        message: "Email Already Exists.",
      });
    }
    // trim the first and last name of the user ======>
     firstName = await CommonService.trimResponse(firstName);
     lastName = await CommonService.trimResponse(lastName);
    // create the hashed password========>
    let hashedPassword = await bcryptjs.hash(password, 12);
    const result = await models.users.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
      activeStatus: 1
    });
    const options = {userId: result?.id}
    if (result) {

      // action logs for the Create User=====>
      await CommonService.actionLogs(
         "User" ,
         result?.id ,
         CREATED ,
         options ,
         result?.id ,
         req ,
      )
      await models.users.update(
        { createdBy: result.id },  // Assuming req.user.id is the id of the user who created the new employee
        { where: { id: result.id } }
      );
      const {verificationLink} = await GenerateVerifyUrl(URL_CONFIG.account_verify_url, result.id)
      let emailDetails = result.email;
      SaveEventService(EVENTS_CONSTANTS.ACCOUNT_VERIFICATION, {
        userId: result.id,
        email_to: result.email,
        replacements: {
          EMPLOYEE_NAME: `${result.firstName} ${result.lastName}`,
          VERIFICATION_LINK: verificationLink
        },
      });
      return res.json({
        status: 1,
        message: req.__('Account registered. Please verify your account by clicking the link sent to your registered email address {{emailDetails}}', {emailDetails: emailDetails})
      });
    } else {
      return res.json({
        status: 0,
        message: req.__("failed_to_create"),
      });
    }
  } catch (error) {
    await CommonService.filterError(error, req, res);
  }
};


//COMPLETE PROFILE FOR NEW USER ==============================>
exports.completeProfileNewEmployee = async (req, res) => {
  try {
    const {id, interests, locations, profile_desc, profile_title, skills, time_availability} = req?.body;
    let actionLogOption = {id : id}
    let options = {
      where: {
        id: id,
        deleted: 0
      },
      attributes: {
        exclude: ['password']
      },
    }
    //  check wheather the user 
    const user = await models.users.findOne(options)
    if (user) {
      // update the  user details.
      actionLogOption=await CommonService.actionLogs(
        "Complete-Profile",
        user?.id,
        UPDATE,
        actionLogOption,
        id,
        req,
        res
      )
      await user.update({
        profile_desc: profile_desc,
        profile_title: profile_title,
        time_availability: time_availability,
        isCompleted: 1,
        isSkipped: 1 ,
        updatedBy : req?.user?.id
      },actionLogOption)

      // set the skill and interest ======================>
      // if skill and interest is  present delete all those===========>
      await models.user_skills_or_interests.update(
        {deleted: 1 ,  updatedBy : req?.user?.id},
        {
          where: {
            userId: id,
            deleted : 0
          },
          individualHooks: true,
          id : id,
          actionLogId : actionLogOption.actionLogId,
        }
      );

      let newSKillInterest = [];

      //  insert the new interest for the employee by deleting the old one...
      // console.log("checking" , interest , skills)
      if (interests && interests.length > 0) {
        interests.forEach((interest) => {
          newSKillInterest.push({
            userId: id,
            type: "interest",
            reference_id: interest,
            createdBy : req?.user?.id ,
            deleted: 0,
          });
        });
      }

      // insert the new skills

      if (skills && skills.length > 0) {
        skills.forEach((skill) => {
          newSKillInterest.push({
            userId: id,
            type: "skill",
            reference_id: skill,
            createdBy : req?.user?.id ,
            deleted: 0,
          });
        });
      }

      // insert the new locations ===========>
      if (locations && locations.length > 0) {
        locations.forEach((location) => {
          newSKillInterest.push({
            userId: id,
            type: "location",
            reference_id: location,
            createdBy : req?.user?.id ,
            deleted: 0,
          });
        });
      }

      if (newSKillInterest.length > 0) {
        await models.user_skills_or_interests.bulkCreate(newSKillInterest);
      }
      user.save();
      const updatedUser = await models.users.findOne(options);
      // create the action logs for the 
      await CommonService.actionLogs(
        "User_complete_profile" ,
         id ,
        UPDATE ,
        options ,
        id ,
        req
       )
      // const userData = await models.users.findOne(userOptions);
      return res.send({
        status: 1,
        message: "Success",
        data: updatedUser
      })

    } else {
      return res.json({
        message: 'User does not Exists.',
        status: 0
      })
    }


  } catch (error) {
    await CommonService.filterError(error, req, res);
  }
}

// FOR SKIP PROFILE DETAILS==================>
exports.isSkippedForEmployee = async (req, res) => {
  try {
    const id = req?.params?.id;
    let actionLogOption ={id : id}
    let options = {
      where: {
        id: id,
        deleted: 0
      }
    }
    const user = await models.users.findOne(options);
    if (user) {
      if (user.isSkipped === 0) {
        actionLogOption =  await CommonService.actionLogs(
          "user_isSkipped",
          id,
          UPDATE,
          actionLogOption,
          req?.user?.id,
          req,
          res
        );
        await user.update(
          {isSkipped: 1},
          actionLogOption
        )

        return res.json({
          message: 'Update Successfully',
          status: 1
        })
      }
      else {
        return res.json({
          message: 'Something went wrong!',
          status: 0
        })
      }
    } else {
      return res.json({
        message: 'User does not Exist.',
        status: 0
      })
    }
  } catch (error) {
    await CommonService.filterError(error, req, res);
  }
}

// Function to validate email format
function isValidEmailFormat(email) {
  // This is a basic email format validation, can be improved
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}