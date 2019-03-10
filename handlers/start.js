require("dotenv").config();

const Markup = require('telegraf/markup');


const _ = require("lodash");

class StartCommand {
    constructor(app, db) {
        this.app = app;
        this.db = db;
        this.setCommand()
    }

    setCommand() {
        this.app.command('start', (ctx) => {
            const {replyWithHTML, reply} = ctx;
            const {username} = ctx.from;
            const chat_type = _.get(ctx, ['update', 'message', 'chat', 'type']);

            if(chat_type !== 'private' ){
                return replyWithHTML(`Welcome , The XRP Bot successfully started.\nuse <code>/tip</code> command to send tip to other members of group.`)
            }


            let content='';

            if(username){
                content =`Welcome <b>${username}</b> !\nPlease use /help to see the available commands\n\n<b>Warning :</b>\nDo not forget to use the /start command after updating your username so we can understand the changes!`
            }else{
                content = `Welcome !\n\n<b>Warning: </b>\nIt's seems you doesn't set any username to your account , Please set an username and then use /start command so we can understand the changes `
            }

            return replyWithHTML(content, Markup
                .keyboard([
                    ['😎 Send $XRP'],
                    ['⚖️ Balance', '⬇️ Deposit', '⬆️ Withdraw'],
                    ['⚙ Settings', '👥 Contact']
                ])
                .resize()
                .extra()
            )

        })
    }
}

module.exports = StartCommand;
