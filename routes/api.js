const api = require('express')();
const AuthRouter = require('./auth');
const publicRouter = require('./publicData');
const OppRouter = require('./opportunity');
const UserRouter = require('./user');
const reviewRouter = require('./reviews.route');
const applicationRouter = require('./application.route');
const uploadRouter = require('./uploadImage.route');
const notificationRouter = require('./notificaion.route');
const eventsRouter = require('./events.route');

api.use('/user-management', UserRouter);
api.use('/auth', AuthRouter)
api.use('/opportunity', OppRouter);
api.use("/public-list", publicRouter);
api.use('/reviews', reviewRouter);
api.use('/upload', uploadRouter)
api.use('/application', applicationRouter);
api.use('/notification', notificationRouter);
api.use("/events", eventsRouter)


module.exports = api