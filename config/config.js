const clog = require('../services/ChalkService');
console.log("here is the data " ,  process.env.DB_USER_NAME)
exports.dbconfig = {
    username: process.env.DB_USER_NAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: (sqlquery) => {
        clog.sql(sqlquery);
     },
}
