const CommonService = require("../services/CommonService");
const models = require("../models/index");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const qs = require("qs");
const bcrypt = require("bcrypt");
const { ValidateVerifyUrl, GenerateVerifyUrl } = require("../services/users.service");
const clog = require("../services/ChalkService");
const { SaveEventService } = require("../services/events.service");
const URL_CONFIG = require("../config/urls.config");
const { generateHash, generateJWTAccessToken } = require("../services/auth.service");
const EVENTS_CONSTANTS = require("../config/events.config");

// login by AWS COGNITO SSO=========================================>
async function createUser(data) {
  try {
    let pass = "111111";

    const hashedPassword = await bcrypt.hash(pass, 10);

    let result = await models.users.create({
      ...data,
      password: hashedPassword,
    });

    return result;
  } catch (error) {
    console.log(error);
    return { status: 0, message: error.message };
  }
}

async function awsCallTokenEndpoint(grantType, accessToken) {
  const data = {
    grant_type: grantType,
    client_id: process.env.COGNITO_CLIENT_ID,
    code: accessToken,
    scope: "profile",
    redirect_uri: process.env.COGNITO_CALLBACK_URL,
  };
  const post = {
    method: "post",
    url: `${process.env.COGNITO_DOMAIN_URL}/oauth2/token`,
    data: qs.stringify(data),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    auth: {
      username: process.env.COGNITO_CLIENT_ID,
      password: process.env.COGNITO_SECRET,
    },
  };
  console.log("postpostpost", post);

  let response = await axios(post)
    .then((response) => {
      return { status: 1, data: response.data };
    })
    .catch((error) => {
      console.log("error", error);
      console.log("error", error.message);
      return { status: 0, message: error.message };
    });

  return response;
}

async function getEmailFromCode(code) {
  const awsAuthorizationCodeResponse = await awsCallTokenEndpoint(
    "authorization_code",
    code
  );
  if (!awsAuthorizationCodeResponse.status) return awsAuthorizationCodeResponse;

  console.log("++++", awsAuthorizationCodeResponse);

  // extract the token from the response ===>
  let idToken = awsAuthorizationCodeResponse?.data?.id_token;
  let accessToken = awsAuthorizationCodeResponse?.data?.access_token;
  let refreshToken = awsAuthorizationCodeResponse?.data?.refresh_token;

  // ==================================================================

  const unverifiedDecodedAuthorizationCodeIdToken = jwt.decode(
    awsAuthorizationCodeResponse.data.id_token,
    { complete: true }
  );
  console.log("------", unverifiedDecodedAuthorizationCodeIdToken.payload);
  // Make sure that the profile checkbox is selected in the App client settings in cognito for the app. Otherwise you will get just the email
  const { email } = unverifiedDecodedAuthorizationCodeIdToken.payload;
  const returnObject = {
    status: 1,
    data: {
      email: email,
      idToken: idToken,
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  };
  return returnObject;
}



exports.login = async (req, res) => {
  try {
    let { code } = req.body;
    let response = await getEmailFromCode(code);
    if (!response.status) return res.send(response);
    if (!response?.data.email) {
      return res.json({
        status: 0,
        message: "Authentication Failed!",
      });
    }

    let user = await models.users.findOne({
      where: {
        email: response?.data?.email,
        deleted: 0,
      },
    });

    // if the user is not present in the AWS then we create the default user in our Database->default values
    if (!user) {
      user = await createUser({
        email: response?.data.email,
        firstName: response?.data?.firstName || "vikasAws",
        lastName: response?.data?.lastName || "sharmaAws",
        mobile: "1111111111",
        time_availability: "20",
        profilePicture: null,
        createdAt: req?.userId,
      });
    }

    // set the accessToken for the request user
    let id = user.id;
    let JWT_SECRET = process.env.JWT_SECRET || "HH5u6mKP9sljSVi";
    // delete user.dataValues["password"];
    const accessToken = jwt.sign(
      { userId: id }, JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "16d",
      }
    );

    user.dataValues["accessToken"] = accessToken;
    return res.send({
      status: 1,
      data: user,
      // idToken : response?.data?.idToken ,
      // refreshToken : response?.data?.refreshToken
    });
  } catch (error) {
    CommonService.filterError(error, req, res);
  }
};

exports.newVerificationLink = async (req, res) => {
  try {
    const { userId, employeeEmail, employeeName } = req.body;
    let verification_page = URL_CONFIG.account_verify_url;
    const { status, verificationUrl } = await GenerateVerifyUrl(verification_page, userId);
    if (status) {
      await SaveEventService(EVENTS_CONSTANTS.ACCOUNT_VERIFICATION, {
        userId: userId,
        email_to: employeeEmail,
        replacements: {
          VERIFICATION_LINK: verificationUrl,
          EMPLOYEE_NAME: employeeName
        }
      });
      return res.json({ status: 1, message: req.__("Account Verification Link Sent") });
    } else {
      return res.status(200).json({ status: 0, message: req.__("Account Can't be verified please try again") });
    }
  } catch (error) {
    clog.error("Error in Api", error);
    CommonService.filterError(error, req, res);
  }
}
exports.verifyUserAccount = async (req, res) => {
  try {
    const { token } = req.params;
    const { status, user } = await ValidateVerifyUrl(token, [{ field: 'email_verify', value: 1 }]);
    if (status === true) {
      SaveEventService(EVENTS_CONSTANTS.EMPLOYEE_REGISTER, {
        userId: user.id,
        email_to: user.email,
        replacements: {
          FULL_NAME: `${user.firstName} ${user.lastName}`,
        },
      });
      return res.json({ status: 1, message: "Account Verified Successfully" });
    } else {
      return res.status(200).json({ status: 0, message: "Verification link is Expired" });
    }
  } catch (error) {
    clog.error('Verifying Error ', error)
    await CommonService.filterError(error, req, res);
  }
}
exports.forgotPasswordGenerate = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(200).json({ status: 0, message: "Required Fields not found" });
    }
    const UserDetails = await models.users.findOne({
      where: {
        email,
        deleted: 0,
      },
    });
    if (UserDetails) {
      const forgotPageUrl = URL_CONFIG.forgot_password_url
      const { status, verificationLink } = await GenerateVerifyUrl(forgotPageUrl, UserDetails.id);
      if (status) {
        await SaveEventService(EVENTS_CONSTANTS.FORGOT_PASSWORD, {
          userId: UserDetails.id,
          email_to: UserDetails.email,
          replacements: {
            VERIFICATION_LINK: verificationLink,
            EMPLOYEE_NAME: UserDetails.firstName + " " + UserDetails.lastName
          }
        });
        return res.json({ status: 1, message: "A password reset link sent to your email address " + UserDetails.email });
      } else {
        return res.json({ status: 1, message: "Whoops! Something went wrong, please try again later" });
      }

    } else {
      return res.status(200).json({ status: 0, message: "Account not exist." });
    }
  } catch (error) {
    await CommonService.filterError(error, req, res);
  }
}
exports.forotPasswordSave = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    clog.success("DataBody", req.body);
    if (password !== confirmPassword || !password) {
      return res.json({ status: 0, message: req.__("Confirm password should be same as password") })
    }
    const hashedPassword = await generateHash(password);
    const { status, user } = await ValidateVerifyUrl(token, [{ field: 'password', value: hashedPassword }, { field: 'email_verify', value: 1 }]);
    if (status) {
      res.status(200).json({
        status: 1,
        message: "Reset Password Successful.",
      });
    } else {
      res.json({
        status: 0,
        message: req.__("Reset password link invalid!"),
      });
    }
  } catch (error) {
    CommonService.filterError(error, req, res);
  }
}

// to referesh the user token 
exports.refreshUserToken = async (req, res) => {
  try {
    const userId = req?.userId;
    const data = {
      status:0,
      message : "Something went wrong!",
    }
    if (userId) {
      const refreshToken = await generateJWTAccessToken(userId);
      if(refreshToken){
        data.refresh_token = refreshToken;
        data.message = "Token refreshed!"
        data.status = 1;
      }
    }
    return res.json({
      ...data
    });

  } catch (e) {
    console.log('errorWhileRefereshingToken', e)
    return res.json({
      status: 0,
      message:"Something Went Wrong!"
    });

  }
}