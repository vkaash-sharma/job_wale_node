const express = require('express')
const AuthRouter = express.Router();
const authController = require('../controller/auth.controller')
const isAuth = require('../middleware/jwt_auth')

AuthRouter.post('/login', authController.login);
AuthRouter.post('/account-verify/generate', authController.newVerificationLink);
AuthRouter.post('/account-verify/:token', authController.verifyUserAccount);
AuthRouter.post('/forgot-password/request', authController.forgotPasswordGenerate);
AuthRouter.post('/forgot-password/save/:token', authController.forotPasswordSave);
AuthRouter.post('/refresh-user-token' ,isAuth,  authController.refreshUserToken)
module.exports = AuthRouter