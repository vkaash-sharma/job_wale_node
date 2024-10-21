const FrontendBaseUrl = process.env.APP_URL;
const URL_CONFIG = {
    account_verify_url: FrontendBaseUrl + 'auth/account-verify/',
    forgot_password_url: FrontendBaseUrl + 'auth/reset-password/',

}
module.exports = URL_CONFIG;