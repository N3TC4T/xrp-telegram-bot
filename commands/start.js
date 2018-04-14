require("dotenv").config();

const _ = require("lodash");

class StartCommand {
    constructor(app, db) {
        this.app = app;
        this.db = db;
        this.setCommand()
    }

    setCommand() {
        this.app.command('start', (ctx) => {
            const {replyWithHTML} = ctx;
            const {username} = ctx.from;
            const chat_type = _.get(ctx, ['update', 'message', 'chat', 'type']);

            if(chat_type !== 'private' ){
                return replyWithHTML(`Welcome , The Ripple Bot successfully started.\nuse <code>/tip</code> command to send tip to other members of group.`)
            }

            if(username){
                return replyWithHTML(
                    `Welcome <b>${username}</b> !\nPlease use /help to see the available commands\n\n<b>Warning :</b>\nDo not forget to use the /start command after updating your username so we can understand the changes!`
                )
            }else{
                return replyWithHTML(
                    `Welcome !\n\n<b>Warning: </b>\nIt's seems you doesn't set any username to your account , Please set an username and then use /start command so we can understand the changes `
                )
            }
        })
    }
}

module.exports = StartCommand;
