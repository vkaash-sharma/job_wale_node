var cron = require("node-cron");
const clog = require("../services/ChalkService");
const {CompletedOpportunitySchedule} = require("../services/cronService");

// This Cron Service Will run every Day at 7 AM
const OppCompletionCron = cron.schedule("* 7 * * *", () => {
    /* this function will convert completed opportunity status */
    clog.info("\n|==============================================\n| Updating the Opportunity Status to Completed...\n|==============================================");
    CompletedOpportunitySchedule();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

module.exports = OppCompletionCron;