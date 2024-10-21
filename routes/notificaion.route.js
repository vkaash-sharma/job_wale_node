const express = require('express')
const notificationRouter = express.Router();
const isAuth = require('../middleware/jwt_auth');
const {getAllNotificationList, markReadNotificationList} = require('../controller/notification.controller');


notificationRouter.get('/notification-list', isAuth, getAllNotificationList);
notificationRouter.post('/read-notification', isAuth, markReadNotificationList);

module.exports = notificationRouter