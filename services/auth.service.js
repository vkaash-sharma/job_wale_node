const bcryptjs = require("bcryptjs");
const clog = require("./ChalkService");
const {__} = require("i18n");
const jwt = require("jsonwebtoken");
exports.generateHash = async (str) => {
    const hashedStr = await bcryptjs.hash(str, 12);
    return hashedStr;
}
exports.compareHash = async (str, hashedStr) => {
    const compareResult = await bcryptjs.compare(str, hashedStr);
    return compareResult;
}


exports.checkTheValidUser = async (email) => {
    try {
        let validDomains = ["ideateplus.com", "who.int", "paho.org", "codefire.org", "codefire.in", "yopmail.com"];
        const domain = email.split('@')[1];
        if (!validDomains.includes(domain) || domain === undefined) {
            return {
                status: 0,
                message: __("Please enter the valid email address.")
            }
        }
        return {status: 1}
    } catch (error) {
        clog.error(error);
        return false;
    }
}

exports.generateJWTAccessToken = async  (userId='') => {
    try{
        if(userId && userId!==''){
            const JWT_SECRET = process.env.JWT_SECRET || "HH5u6mKP9sljSVi";
            const accessToken = jwt.sign(
                { userId: userId }, 
                JWT_SECRET,
                {
                    algorithm: "HS256",
                    expiresIn: "16d",
                }
            );
            return accessToken;
        }
        return null;
    }catch(error){
        console.log('errorWhileGeneratingJWT',e)
        return null;
    }
}