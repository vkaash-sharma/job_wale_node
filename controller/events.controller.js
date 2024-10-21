const {ProcessEventById, SaveEventService} = require("../services/events.service");

const eventSaveController = async (req, res) => {
    try {
        const {event_name, userId, email_to, attachments, replacements, cc, bcc} = req.body;
        const result = await SaveEventService(event_name, {userId, email_to, attachments, replacements, cc, bcc});
        res.json({message: "Saving Event", result});
    } catch (error) {
        clog.error('Error Saving Event', error);
        res.json({message: 'Error while Saving event'});
    }
}
const eventProcessController = async (req, res) => {
    try {
        const {eventId} = req.body;
        const result = await ProcessEventById(eventId);
        res.json({message: "Processing Event", result});
    } catch (error) {
        clog.error('Error Process Event', error);
        res.json({message: 'Error while processing event'});
    }
}

module.exports = {
    eventSaveController,
    eventProcessController
}