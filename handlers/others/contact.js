require("dotenv").config();
const { Extra} = require('telegraf')

const _ = require("lodash");

const CONTACT = `
Do you wish to report a problem in the bot, or do you have a question or comment? Please contact via one of the contact options below.

Telegram: @N3TC4T
Twitter: https://twitter.com/baltazar223
Email: netcat.av@gmail.com
`

class BalanceHandler {
    constructor(app, db) {
        this.app = app;
        this.db = db;
    }

    setHandler() {
        this.app.hears('👥 Contact', async(ctx) => {
            const {replyWithHTML} = ctx;
            // can not run this command in groups
            const chat_type = _.get(ctx, ['update', 'message', 'chat', 'type']);

            if(chat_type !== 'private'){
                return replyWithHTML(`<b>This command is not available in ${chat_type}!</b>`)
            }

            const userModel = new this.db.User ;
            const user = await userModel.getUser(ctx);
            replyWithHTML(CONTACT, Extra.webPreview(false))
        })
    }
}

module.exports = BalanceHandler;
