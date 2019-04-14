require('dotenv').config();

//libs
const { Composer } = require('telegraf');

// this is for groups

const helpMsg = `Command reference:
/start - Start bot
/tip - Tip a user in XRP
/airdrop - Airdrop some XRP to random group members
/market - Market tickers/price
/subscribe - Subscribe to XRP Community Blog
/unsubscribe - Unsubscribe to XRP Community Blog

***Note***: This commands only work in groups
`;

class HelpHandler {
    constructor(app, db) {
        this.app = app;
        this.db = db;
    }

    setHandler() {
        this.app.command(
            'help',
            Composer.groupChat(ctx => {
                const { replyWithMarkdown } = ctx;
                return replyWithMarkdown(helpMsg);
            }),
        );
    }
}

module.exports = HelpHandler;
