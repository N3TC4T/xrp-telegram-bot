require("dotenv").config();
const _ = require("lodash");

const { admin } = require('telegraf')
const Markup = require('telegraf/markup');

class StartHandler {
    constructor(app, db) {
        this.app = app;
        this.db = db;
    }

    setHandler() {
        this.app.command('start', admin((ctx) => {
            const {replyWithHTML, reply} = ctx;
            const {username} = ctx.from;
            const chat_type = _.get(ctx, ['update', 'message', 'chat', 'type']);

            if(chat_type !== 'private' ){
                return replyWithHTML(`Welcome , The XRP Bot successfully started.\nYou can use /tip command to send tip to other members of group.\nfor view all commands please use /help command`)
            }


            let content='';

            if(username){
                content =`Welcome <b>${username}</b> !\nHope you enjoy working with bot, please feel free to contact me if you had problems with bot @N3TC4T\n\n<b>Warning :</b>\nDo not forget to use the /start command after updating your username so we can understand the changes!`
            }else{
                content = `Welcome !\n\n<b>Warning: </b>\nIt's seems you doesn't set any username to your account , Please set an username and then use the bot so we can understand the changes `
            }

            return replyWithHTML(content, Markup
                .keyboard([
                    ['➡️ Send $XRP', '📈 Market'],
                    ['⚖️ Balance', '⬇️ Deposit', '⬆️ Withdraw'],
                    ['🔔 Notificaiton', '👥 Contact']
                ])
                .resize()
                .extra()
            )

        }))
    }
}

module.exports = StartHandler;
