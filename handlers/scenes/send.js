require("dotenv").config();

const Composer = require('telegraf/composer');
const Markup = require('telegraf/markup');
const WizardScene = require('telegraf/scenes/wizard');

//utils
const _ = require("lodash");
const moment = require("moment");

//libs
const address_codec = require('ripple-address-codec');
const logger = require('../../lib/loggin');

//constants
const v = require("../../config/vars");


const CANCEL_TEXT = 'Back 🔙';
const MAIN_MENU =  Markup.keyboard([
        ['➡️ Send $XRP', '📈 Market'],
        ['⚖️ Balance', '⬇️ Deposit', '⬆️ Withdraw'],
        ['🔔 Notificaiton', '👥 Contact']
    ])
    .resize()
    .extra()


class SendHandler {
    constructor(app, db, stage) {
        this.app = app;
        this.db = db;
        this.ctx = null;
        this.stage = stage;
    }


    Cancel (ctx) {
        try {
            const { replyWithHTML, scene } = ctx ;
            ctx.deleteMessage().catch((e) => {})
            scene.leave()
            return replyWithHTML('ℹ️ Main Menu.', MAIN_MENU)
        }catch (e) {
            console.log("-- Cancel Error:")
        }

    }

    stepOne(){
        const stepOneHandler = new Composer();
        stepOneHandler.hears(CANCEL_TEXT, this.Cancel);
        stepOneHandler.on('message', async ctx => {
            const message = ctx.update.message.text;
            const username = message.replace('@', '');

            const userModel = new this.db.User;
            const from_user = await userModel.getUser(ctx);

        
            if(!username || username.length < 5){
                return ctx.reply('⚠️ Please enter a valid telegram username. Ex: @n3tc4t');
            }

            if(from_user.username.toLowerCase() === username.toLowerCase()){
                return ctx.reply(`️️️️⚠️ You can not send to yourself!`)
            }

            //set send username
            ctx.scene.session.state.username = username;

            ctx.wizard.next();
            return ctx.wizard.steps[ctx.wizard.cursor](ctx);
        } );

        return stepOneHandler
    }


    stepTwo(){
        const stepTwoHandler = new Composer();

        stepTwoHandler.hears(CANCEL_TEXT, this.Cancel);
        stepTwoHandler.on('message', async ctx => {
            const { replyWithHTML } = ctx;
            let amount = ctx.update.message.text;

            const userModel = new this.db.User;
            const user = await userModel.getUser(ctx);

            if (amount === 'all') {
                amount = user.balance
            }

            if (user.balance === 0) {
                return replyWithHTML(
                    "You don't have any XRP in your account , deposit with /deposit command"
                )
            }

            if (!/^[+-]?\d+(\.\d+)?$/.test(amount)) {
                return replyWithHTML(`<b>Invalid Amount</b>`)
            } else {//valid amount
                if(parseFloat(amount) < 0.000001)
                {
                    return replyWithHTML(`<b>The minimum amount to send is 0.000001 XRP!</b>`)
                }
                if (parseFloat(user.balance) < parseFloat(amount)) {//Insufficient fund
                    return replyWithHTML(`<b>Insufficient Balance</b>`)
                }
            }

            //set withdraw amount
            ctx.scene.session.state.amount = amount;

            ctx.wizard.next();
            return ctx.wizard.steps[ctx.wizard.cursor](ctx);

        } );

        return stepTwoHandler
    }


    stepThree(){
        const stepThreeHandler = new Composer();

        stepThreeHandler.hears(CANCEL_TEXT, this.Cancel);
        stepThreeHandler.action('confirm-send-no', this.Cancel);

        stepThreeHandler.action('confirm-send-yes', async (ctx) => {
            const {replyWithHTML} = ctx;
            const {state} = ctx.scene.session;

            const unlock = await ctx.session.lock();

            try {

                const userModel = new this.db.User;

                const from_user = await userModel.getUser(ctx);
                const to_user = await userModel.getUserByUsername(state.username);

                logger.info(`Send - ${from_user.username}:${from_user.id} -> ${to_user.username}:${to_user.id} - ${state.amount}`);

                // change balances
                const sender_balance = await userModel.decreaseBalance(from_user, state.amount);
                const recipient_balance = await userModel.increaseBalance(to_user, state.amount);

                const datetime = moment().format(v.DATE_FORMAT);

                // create transaction
                await this.db.Transaction.create({
                    amount: state.amount,
                    type: 'direct',
                    sender_username: from_user.username,
                    recipient_username: to_user.username,
                    from_user: from_user.id,
                    to_user: to_user.id,
                    datetime
                });

                // send message to recipient if there is any telegram id
                if (to_user.telegramId) {
                    this.app.telegram.sendMessage(to_user.telegramId,
                        `<b>${state.amount}</b> XRP is received from @${from_user.username}\nYour new balance is <b>${recipient_balance} XRP</b>`,
                        {parse_mode: 'HTML'}
                    )
                }

                return replyWithHTML(
                    `✅ <b>${state.amount} XRP</b> Successfully sent to @${to_user.username}!`
                )
                

            }
            catch(err) {
                logger.error(`Send Error - ${err}`);
                replyWithHTML(`<b>Something is wrong on sending XRP , please report the problem.</b>`, MAIN_MENU)
            }
            finally {
                // unlock after everything is done
                unlock();
                ctx.deleteMessage().catch((e) => {})
                ctx.scene.leave()
                return replyWithHTML('ℹ️ Main Menu.', MAIN_MENU)
            }
        });


        return stepThreeHandler
    }

    async setWizard(){
        await this.stage.register(new WizardScene('send',
            (ctx) => {
                ctx.replyWithHTML(
                    'Please respond to us with a valid telegram <b>username</b>',
                    Markup.keyboard([[CANCEL_TEXT]])
                        .resize()
                        .extra()
                );
                return ctx.wizard.next()
            },
            this.stepOne(),
            (ctx) => {
                ctx.reply('How much XRP do you want to send?');
                return ctx.wizard.next()
            },
            this.stepTwo(),
            (ctx) => {
                const {state} = ctx.scene.session;
                ctx.replyWithHTML(
                    `<b>CONFIRM</b>\n\nYou want to send <b>${state.amount} XRP</b> to <b>@${state.username}</b> is this correct?`,
                    Markup.inlineKeyboard([
                        Markup.callbackButton('Yes', 'confirm-send-yes'),
                        Markup.callbackButton('No', 'confirm-send-no')
                    ]).extra()
                );
                return ctx.wizard.next()
            },
            this.stepThree()
        ))
    }

    setHandler(){
        this.app.hears('➡️ Send $XRP', async(ctx) => {
            const {replyWithHTML, scene} = ctx;
            // can not run this command in groups
            const chat_type = _.get(ctx, ['update', 'message', 'chat', 'type']);

            if(chat_type !== 'private'){
                return replyWithHTML(`<b>This type of command is not available in ${chat_type}!</b>`)
            }

            scene.enter('send')
        })
    }

}

module.exports = SendHandler;
