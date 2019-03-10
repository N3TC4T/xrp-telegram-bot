require("dotenv").config();
const _ = require('lodash')


const Markup = require('telegraf/markup');

const CANCEL_TEXT = '🔙 Back';
const MAIN_MENU =  Markup.keyboard([
        ['➡️ Send $XRP', '📈 Market'],
        ['⚖️ Balance', '⬇️ Deposit', '⬆️ Withdraw'],
        ['🔔 Notificaiton', '👥 Contact']
    ])
    .resize()
    .extra()


class NotificationHandler {
    constructor(app, db, stage) {
        this.app = app;
        this.db = db;
        this.ctx = null;
        this.stage = stage;
    }


    Cancel (ctx) {
        try {
            const { replyWithHTML } = ctx ;
            return replyWithHTML('ℹ️ Main Menu.', MAIN_MENU)
        }catch (e) {
            console.log(e)
        }
    }

        
    Menu (ctx) {
        ctx.replyWithHTML('Notifications Settings', Markup
       .keyboard([
           ['ℹ️ Wallet Notify', 'ℹ️ Feed Notify'],
           [CANCEL_TEXT]
       ])
       .resize()
       .extra()
       )
       ctx.deleteMessage().catch((e) => {})
       ctx.scene.leave().catch((e) => {})
   }


    setHandler(){
        this.app.hears(CANCEL_TEXT, this.Cancel);
        this.app.hears('🔔 Notificaiton', async(ctx) => {
            const {replyWithHTML} = ctx;
            
            // can not run this command in groups
            const chat_type = _.get(ctx, ['update', 'message', 'chat', 'type']);

            if(chat_type !== 'private'){
                return replyWithHTML(`<b>This type of command is not available in ${chat_type}!</b>`)
            }
            this.Menu(ctx)
           
        })
        this.app.hears('ℹ️ Wallet Notify', async(ctx) => {
            const {replyWithHTML, scene} = ctx;
            // can not run this command in groups
            const chat_type = _.get(ctx, ['update', 'message', 'chat', 'type']);

            if(chat_type !== 'private'){
                return replyWithHTML(`<b>This type of command is not available in ${chat_type}!</b>`)
            }
            return ctx.replyWithHTML('Wallet Notify Settings', Markup
            .keyboard([
                ['➕ Add Wallet', '📇 Manage Wallets'],
                [CANCEL_TEXT]
            ])
            .resize()
            .extra()
            )

        })
    }

}

module.exports = NotificationHandler;
