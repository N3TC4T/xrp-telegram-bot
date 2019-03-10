require("dotenv").config();

const _ = require("lodash");


class BalanceHandler {
    constructor(app, db) {
        this.app = app;
        this.db = db;
    }

    setHandler() {
        this.app.hears('⚖️ Balance', async(ctx) => {
            const {replyWithHTML} = ctx;
            // can not run this command in groups
            const chat_type = _.get(ctx, ['update', 'message', 'chat', 'type']);

            if(chat_type !== 'private'){
                return replyWithHTML(`<b>This type of command is not available in ${chat_type}!</b>`)
            }

            const userModel = new this.db.User ;
            const user = await userModel.getUser(ctx);
            const marketModel = new this.db.Market;
            const toUSD = await marketModel.calculate(user.balance, 'USD')
            replyWithHTML(`Your current balance:\n\n<b>${user.balance} XRP</b> ~ (${toUSD} USD)\n\nYou can use deposit command to add more $XRP to your balance`)
        })
    }
}

module.exports = BalanceHandler;
