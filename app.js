// require("dotenv").config();
let express = require('express');
let cookieParser = require('cookie-parser')
let logger = require('morgan')
let cors = require('cors')
let app = express()
let i18n = require('i18n')
const api = require('./routes/api');
const helmet = require("helmet");
const setEnvironmentVariables = require("./config/AwsSetEnv");

// Security and Cors MiddleWare
app.use(helmet())
// referrer policy
app.use(helmet.referrerPolicy({
    policy: "no-referrer",
}));
// not loading the noSniff() middleware
app.use(
    helmet({
        noSniff: false,
    })
)
app.use(function (req, res, next) {
    let appUrl = process.env.APP_URL;
    if (appUrl.endsWith('/')) {
        appUrl = appUrl.slice(0, -1)
    }
    // NOSONAR - Ignore all issues on this line
    const allowedOrigins = appUrl;
    res.header('Access-Control-Allow-Origin', allowedOrigins);
    res.setHeader('Cross-Origin-Resource-Policy', allowedOrigins);
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization,currentPage"
    );
    res.header("X-Frame-Options", "DENY");
    res.header("Content-Security-Policy", "frame-ancestors 'none'");
    next();
})

// internalisation
i18n.configure({
    locales: ['en'],
    defaultLocale: 'en',
    directory: __dirname + '/locales',
})
app.use(i18n.init)
app.use(logger('dev')); // morgan logs
app.use(express.json()) // application json
app.use(express.urlencoded({extended: false})) // url encoded
app.use(cookieParser()) //cookieparser
app.use("/public", express.static(__dirname + "/public"));
app.use('/', api);
app.get("/", (req, res) => {
    res.send('🌎 Whoop server running here...');
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    res.sendStatus(404)
})

// error handler
app.use(function (err, req, res, next) {
    errormsg =
        req.app.get('env') === 'development'
            ? err.message
            : 'something went wrong'

    // render the error page
    res.status(err.status || 500)
    res.send({error: errormsg})
})

module.exports = app
