const express = require('express')
const publiRouter = express.Router();
const masterDropdownController = require('../controller/master.dropdown')
const isAuth = require('../middleware/jwt_auth');


publiRouter.get('/skill', masterDropdownController.getAllUserSkills)
publiRouter.get('/interest', masterDropdownController.getAllUserInterest)
publiRouter.get('/location', masterDropdownController.getAllLocationList)


module.exports = publiRouter