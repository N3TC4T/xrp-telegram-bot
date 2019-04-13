require('dotenv').config();

const { Composer } = require('telegraf');

class BalanceHandler {
    constructor(app, db) {
        this.app = app;
        this.db = db;
    }

    setHandler() {
        this.app.hears(
            '⚖️ Balance',
            Composer.privateChat(async ctx => {
                const { replyWithHTML } = ctx;

                const userModel = new this.db.User();
                const user = await userModel.getUser(ctx);
                const marketModel = new this.db.Market();
                const toUSD = await marketModel.calculate(user.balance, 'USD');

                if (toUSD == 0) {
                    replyWithHTML(
                        `Your current balance:\n\n<b>${
                            user.balance
                        } XRP</b>\n\nYou can use deposit command to add more $XRP to your balance`,
                    );
                } else {
                    replyWithHTML(
                        `Your current balance:\n\n<b>${
                            user.balance
                        } XRP</b> ~ (${toUSD} USD)\n\nYou can use deposit command to add more $XRP to your balance`,
                    );
                }
            }),
        );
    }
}

module.exports = BalanceHandler;
