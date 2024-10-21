const express = require('express')
const UserRouter = express.Router()
const userController = require("../controller/user.controller")
const isAuth = require('../middleware/jwt_auth')

// user login api...
UserRouter.post('/login' , userController.login);
UserRouter.get('/user/:id' , userController.getUserById)
UserRouter.put('/change-password' ,isAuth ,  userController.changeUserPassword)

// create new employee========>
UserRouter.post('/create' , userController.postNewEmployee);
UserRouter.post('/complete-profile' , userController.completeProfileNewEmployee);
UserRouter.get('/skip-profile/:id' , userController.isSkippedForEmployee)

// route for self user ========>
UserRouter.get('/self/user' ,isAuth , userController.getLoggedUser)
UserRouter.put('/self/user' ,isAuth , userController.EditUserById)


// endorsement for the employee===================>
UserRouter.get('/endorsement/:id' , isAuth , userController.getEndorsementForUser)


module.exports = UserRouter;