require("dotenv").config();

const Composer = require('telegraf/composer');
const Markup = require('telegraf/markup');
const WizardScene = require('telegraf/scenes/wizard');

//utils
const _ = require("lodash");
const moment = require("moment");

//libs
const address_codec = require('ripple-address-codec');


const CANCEL_TEXT = '🔙 Back';
const MAIN_MENU =  Markup.keyboard([
        ['➡️ Send $XRP', '📈 Market'],
        ['⚖️ Balance', '⬇️ Deposit', '⬆️ Withdraw'],
        ['🔔 Notificaiton', '👥 Contact']
    ])
    .resize()
    .extra()


class FeedHandler {
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
        ctx.scene.leave()
    }

    listHandler(){
        const listHandler = new Composer();
        listHandler.hears(CANCEL_TEXT, this.Menu);
        listHandler.on('message', async ctx => {
            const text = ctx.message.text;      
            const source = await this.db.FeedSource.findOne({where: {url: text} })
            if(!source){
                return ctx.replyWithHTML("⚠️ Please select a source from list!")
            }
            const subscriptionsModel = new this.db.Subscriptions
            const subscription = await subscriptionsModel.getSettings(ctx.message.from.id, source.id);

            let isSubscribed =false
            if(subscription && subscription.active == true){
                isSubscribed = true
            }


            
            if(isSubscribed){
                ctx.replyWithHTML(
                    `You already subscribed to this feed\n\nDo you want to unsubsribe to ${source.url} ?`,
                    Markup.inlineKeyboard([
                        Markup.callbackButton('Yes', 'confirm-unsubscribe-yes'),
                        Markup.callbackButton('No', 'confirm-unsubscribe-no')
                    ]).extra()
                );
            }else{
                ctx.replyWithHTML(
                    `You are not subscribe to this feed\n\nDo you want to subsribe to ${source.url} ?`,
                    Markup.inlineKeyboard([
                        Markup.callbackButton('Yes', 'confirm-subscribe-yes'),
                        Markup.callbackButton('No', 'confirm-subscribe-no')
                    ]).extra()
                );
            }
            return ctx.wizard.next()
        })

        return listHandler
    }

    actionHandler(){
        const actionHandler = new Composer();

        actionHandler.hears(CANCEL_TEXT, this.Menu);
        actionHandler.action('confirm-unsubscribe-no', this.Menu)
        actionHandler.action('confirm-subscribe-no', this.Menu)

        actionHandler.action('confirm-unsubscribe-yes', (ctx) => {
            const from = ctx.update.callback_query.from;
            const subscriptionsModel = new this.db.Subscriptions;
            subscriptionsModel.setSettings(from.id, false)
            ctx.replyWithHTML('You successfully unsubscribed from this feed')
            this.Menu(ctx)
        });
        
        actionHandler.action('confirm-subscribe-yes', (ctx) => {
            const from = ctx.update.callback_query.from;
            const subscriptionsModel = new this.db.Subscriptions;
            subscriptionsModel.setSettings(from.id, true)
            ctx.replyWithHTML('You successfully subscribed to this feed')
            this.Menu(ctx)
        });

        return actionHandler
    }
    async setWizard(){
        await this.stage.register(new WizardScene('feed_notify',
            (ctx) => {
                const MENU = []
                // const sources = await this.db.FeedSource.findAll()
                // sources.forEach((s) => {
                //     MENU.push([s.url])
                // })
                MENU.push(['https://xrpcommunity.blog/rss/'])
                MENU.push([CANCEL_TEXT])

                ctx.replyWithHTML(
                    'Please choose a feed to manage:',
                    Markup.keyboard(MENU)
                        .resize()
                        .extra()
                );
                ctx.wizard.next()
            },
            this.listHandler(),
            this.actionHandler()
        ))
    }

    setHandler(){
        this.app.hears(CANCEL_TEXT, this.Cancel);
        this.app.hears('ℹ️ Feed Notify', async(ctx) => {
            const {replyWithHTML, scene} = ctx;
            // can not run this command in groups
            const chat_type = _.get(ctx, ['update', 'message', 'chat', 'type']);

            if(chat_type !== 'private'){
                return replyWithHTML(`<b>This type of command is not available in ${chat_type}!</b>`)
            }

            scene.enter('feed_notify')

        })
    }

}

module.exports = FeedHandler;
