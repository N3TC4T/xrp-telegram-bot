require("dotenv").config();

const _ = require("lodash");


class BalanceCommand {
    constructor(app, db) {
        this.app = app;
        this.db = db;
        this.setCommand()
    }

    setCommand() {
        this.app.command('balance', async(ctx) => {
            const {replyWithHTML} = ctx;
            // can not run this command in groups
            const chat_type = _.get(ctx, ['update', 'message', 'chat', 'type']);

            if(chat_type !== 'private'){
                return replyWithHTML(`<b>This type of command is not available in ${chat_type}!</b>`)
            }

            const userModel = new this.db.User ;
            const user = await userModel.getUser(ctx);
            replyWithHTML(`<b>Balance: </b><code>${user.balance} XRP</code>`)
        })
    }
}

module.exports = BalanceCommand;
