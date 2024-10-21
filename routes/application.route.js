const express = require('express')
const applicationRouter = express.Router();
const isAuth = require('../middleware/jwt_auth');
const { applicationStatusHandle } = require('../controller/application.controller');


applicationRouter.post('/status-handle/:id' , isAuth , applicationStatusHandle )


module.exports = applicationRouter