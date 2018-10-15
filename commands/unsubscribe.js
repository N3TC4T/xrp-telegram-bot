require("dotenv").config();

const _ = require("lodash");


class BalanceCommand {
    constructor(app, db) {
        this.app = app;
        this.db = db;
        this.setCommand()
    }

    setCommand() {
        this.app.command('unsubscribe', async(ctx) => {
            const {replyWithHTML} = ctx;
            let from = null;
            let update = null;

            const chat_type = _.get(ctx, ['update', 'message', 'chat', 'type']);

            if(chat_type !== 'private'){
                let chat = null;
                if (ctx.updateType === "callback_query") {
                    chat = ctx.update.callback_query.message.chat
                } else {
                    if(_.has(ctx, ['update', 'message', 'chat'])){
                        chat = ctx.update.message.chat
                    }
                }
                from = chat
            }else{
                if (ctx.updateType === "callback_query") {
                    update = ctx.update.callback_query;
                    from = update.from
                } else {
                    update = ctx.update;
                    if(_.has(ctx, ['update', 'message', 'from'])){
                        from = ctx.update.message.from;
                    }
                }
            }

            const subscriptionsModel = new this.db.Subscriptions;

            const result = await subscriptionsModel.setSettings(from.id, false);
            if (result){
                replyWithHTML(`Successfully unsubscribe from XRP Community Blog.`)
            }else{
                replyWithHTML(`You already unsubscribe from XRP Community Blog!`)
            }

        })
    }
}

module.exports = BalanceCommand;
