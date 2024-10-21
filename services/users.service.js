/*  ===========================
    Service For User Validation 
    ===========================*/

const {sequelize} = require("../models");
const clog = require("./ChalkService");
const CommonService = require('./CommonService')
const GenerateVerifyUrl = async (prefix, userId) => {
    try {
        if (!prefix || !userId) {
            return false;
        }
        const userDetails = await sequelize.models.users.findByPk(userId);
        let verificationToken = Buffer.from(userDetails.firstName + userDetails.id).toString(
            "base64"
        );
        let verificationLink = prefix + verificationToken;
        userDetails.verification_token = verificationToken;
        userDetails.save();
        return {status: true, verificationLink};
    } catch (error) {
        clog.error("Error while generating verification url", error);
        return {status: false}
    }
}
const ValidateVerifyUrl = async (token, update) => {
    try {
        if (!token) {
            return false;
        }
        let userData = await sequelize.models.users.findOne({
            where: {
                verification_token: token,
            },
        });
        if (userData) {
            // Update are the fields which will be updated on users table on a successfull validation of token
            if (update && Array.isArray(update)) {
                update.forEach((up) => {
                    userData[up.field] = up.value;
                })
            };
            // userData.verification_token = '';
            userData.save();
            return {status: true, user: userData};
        } else {
            return {status: false};
        }
    } catch (error) {
        clog.error("Error while Verifting verification url", error);
        return {status: false};
    }
}

// check the change password validation ==========>
const changePasswordValidation = async (oldPassword, password , confirmPassword)=>{
   try {
    
    if (!oldPassword || !password || !confirmPassword) {
        return {
          status: 0,
          message: "All fields are required."
        };
      }  
    if(oldPassword === password || password !== confirmPassword) {
        if(oldPassword === password) {
          return {
           status : 0 ,
           message : "New password cannot be the same as the old password."
          }
        }
       if(password !==  confirmPassword) {
         return {
           status : 0 ,
           message : "Password and confirm password do not match."
          }
       }
    } 
    return {
        status : 1 ,
        message : "success"
    }
   }catch(error) {
       await CommonService.filterError(error, req, res);
   }
}

const editUserValidation = async(data) => {
    if(data.profile_desc.length > 2024) {
        return {
            status : 0 ,
            message : "Profile Description: Max 2024 Character required"
        }
    }

    return {status : 1}
}
module.exports = {
    GenerateVerifyUrl,
    ValidateVerifyUrl ,
    changePasswordValidation ,
    editUserValidation
}