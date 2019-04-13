require('dotenv').config();

// libs
const { Extra, Composer } = require('telegraf');

// constants
const CONTACT = `
Do you wish to report a problem in the bot, or do you have a question or comment? Please contact via one of the contact options below.

Telegram: @N3TC4T
Twitter: https://twitter.com/baltazar223
Email: netcat.av@gmail.com
`;

class BalanceHandler {
    constructor(app, db) {
        this.app = app;
        this.db = db;
    }

    setHandler() {
        this.app.hears(
            '👥 Contact',
            Composer.privateChat(async ctx => {
                const { replyWithHTML } = ctx;
                replyWithHTML(CONTACT, Extra.webPreview(false));
            }),
        );
    }
}

module.exports = BalanceHandler;
