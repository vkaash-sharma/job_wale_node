const {eventSaveController, eventProcessController} = require('../controller/events.controller');

const eventsRouter = require('express').Router();

eventsRouter.post('/save-event', eventSaveController);
eventsRouter.post('/process-event', eventProcessController);

module.exports = eventsRouter;