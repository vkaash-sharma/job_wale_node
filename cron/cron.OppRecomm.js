var cron = require("node-cron");
const {OpportunityRecommendation} = require("../services/cronService");
const clog = require("../services/ChalkService");

// This Cron Service Will run every Day at 7 AM
const OppRecommCron = cron.schedule("* 7 * * *", () => {
    /* this function will Send Recommended opportunities to the users */
    clog.info("\n|==============================================\n| Recommended Opportunity Email...\n|==============================================");
    OpportunityRecommendation();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

module.exports = OppRecommCron;