require("dotenv").config();

const OppCompletionCron = require("./cron/cron.OppCompletion");
const OppRecommCron = require("./cron/cron.OppRecomm");

OppCompletionCron.start(); // cron service to send opportunity completion email
OppRecommCron.start(); // cron service to send recommendation completion email