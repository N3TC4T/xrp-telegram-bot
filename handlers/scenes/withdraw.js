require('dotenv').config();

const Composer = require('telegraf/composer');
const Markup = require('telegraf/markup');
const WizardScene = require('telegraf/scenes/wizard');

// utils
const _ = require('lodash');
const moment = require('moment');

// libs
const address_codec = require('ripple-address-codec');
const ripple = require('../../lib/ripple');
const logger = require('../../lib/loggin');

// constants
const v = require('../../config/vars');

const CANCEL_TEXT = 'Back 🔙';
const CANCEL_MENU = Markup.keyboard([[CANCEL_TEXT]])
    .resize()
    .extra();

const MAIN_MENU = Markup.keyboard([
    ['➡️ Send $XRP', '📈 Market'],
    ['⚖️ Balance', '⬇️ Deposit', '⬆️ Withdraw'],
    ['🔔 Notificaiton', '👥 Contact'],
])
    .resize()
    .extra();

class WithdrawHandler {
    constructor(app, db, stage) {
        this.app = app;
        this.db = db;
        this.ctx = null;
        this.stage = stage;
    }

    Cancel(ctx) {
        try {
            const { replyWithHTML, scene } = ctx;
            ctx.deleteMessage().catch(e => {});
            scene.leave();
            return replyWithHTML('ℹ️ Withdraw process canceled.', MAIN_MENU);
        } catch (e) {
            console.log(e);
        }
    }

    stepOne() {
        const stepOneHandler = new Composer();
        stepOneHandler.hears(CANCEL_TEXT, Composer.privateChat(this.Cancel));
        stepOneHandler.on(
            'message',
            Composer.privateChat(ctx => {
                const message = ctx.update.message.text;
                if (!address_codec.isValidAddress(message)) {
                    return ctx.replyWithHTML('⚠️ Please enter a correct XRP address.', CANCEL_MENU);
                }

                if (message === process.env.WALLET_ADDRESS) {
                    return ctx.replyWithHTML(
                        '⚠️ This address cannot be used, please enter another address.',
                        CANCEL_MENU,
                    );
                }

                // set withdraw address
                ctx.scene.session.state.address = message;

                ctx.wizard.next();
                return ctx.wizard.steps[ctx.wizard.cursor](ctx);
            }),
        );

        return stepOneHandler;
    }

    stepTwo() {
        const stepTwoHandler = new Composer();

        stepTwoHandler.hears(CANCEL_TEXT, Composer.privateChat(this.Cancel));
        stepTwoHandler.on(
            'message',
            Composer.privateChat(ctx => {
                const message = ctx.update.message.text;

                if (
                    parseInt(message) == message &&
                    message <= Number.MAX_SAFE_INTEGER &&
                    message >= Number.MIN_SAFE_INTEGER
                ) {
                    // set withdraw tag
                    ctx.scene.session.state.destination_tag = message;

                    ctx.wizard.next();
                    return ctx.wizard.steps[ctx.wizard.cursor](ctx);
                }
                return ctx.replyWithHTML('⚠️ Please enter a correct destination tag.', CANCEL_MENU);
            }),
        );

        return stepTwoHandler;
    }

    stepThree() {
        const stepThreeHandler = new Composer();

        stepThreeHandler.hears(CANCEL_TEXT, Composer.privateChat(this.Cancel));
        stepThreeHandler.on(
            'message',
            Composer.privateChat(async ctx => {
                const { replyWithHTML } = ctx;
                const amount = ctx.update.message.text;

                const userModel = new this.db.User();
                const user = await userModel.getUser(ctx);

                if (user.balance === 0) {
                    replyWithHTML("You don't have any XRP in your account , deposit some XRP first!", MAIN_MENU);
                    return ctx.scene.leave();
                }

                if (!/^[+-]?\d+(\.\d+)?$/.test(amount)) {
                    return replyWithHTML(
                        `<b>Invalid Amount, Please enter currect amount (just number)</b>`,
                        CANCEL_MENU,
                    );
                }
                // valid amount
                if (parseFloat(amount) < 0.1) {
                    return replyWithHTML(
                        `<b>The minimum amount to withdraw is 0.1 XRP, Please enter more and try again.</b>`,
                        CANCEL_MENU,
                    );
                }
                if (parseFloat(user.balance) < parseFloat(amount)) {
                    // Insufficient fund
                    return replyWithHTML(`<b>Insufficient Balance, Please enter a currect amount</b>`, CANCEL_MENU);
                }

                const components = amount.split('.');
                const fraction = components[1] || '0';

                if (fraction.length > 6) {
                    return replyWithHTML(`<b>Too many decimal places!</b>`, CANCEL_MENU);
                }

                // set withdraw amount
                ctx.scene.session.state.amount = amount;

                ctx.wizard.next();
                return ctx.wizard.steps[ctx.wizard.cursor](ctx);
            }),
        );

        return stepThreeHandler;
    }

    stepFour() {
        const stepFourHandler = new Composer();

        stepFourHandler.hears(CANCEL_TEXT, Composer.privateChat(this.Cancel));
        stepFourHandler.action('confirm-withdraw-no', Composer.privateChat(this.Cancel));

        stepFourHandler.action(
            'confirm-withdraw-yes',
            Composer.privateChat(async ctx => {
                const { replyWithHTML } = ctx;
                const { state } = ctx.scene.session;

                const unlock = await ctx.session.lock();

                try {
                    const userModel = new this.db.User();
                    const user = await userModel.getUser(ctx);

                    if (parseFloat(user.balance) < parseFloat(state.amount)) {
                        return this.Cancel(ctx);
                    }

                    const withdraw = {
                        source_tag: user.telegramId,
                        amount: state.amount,
                        address: state.address,
                        destination_tag: state.destination_tag,
                    };

                    const result = await ripple.payment(withdraw);

                    logger.info(`Payment - ${JSON.stringify(result)}`);

                    if (result && result.resultCode !== 'error') {
                        logger.info(
                            `Withdraw - ${withdraw.address}:${withdraw.destination_tag} ${withdraw.amount} - ${
                                user.username
                            }:${user.id}:`,
                        );

                        // decrease user Balance
                        await userModel.decreaseBalance(user, withdraw.amount);

                        // create deposit record
                        await this.db.Withdraw.create({
                            to_address: withdraw.address,
                            destination_tag: withdraw.destination_tag,
                            amount: withdraw.amount,
                            tx_hash: result.hash,
                            for_user: user.id,
                            result: result,
                            datetime: moment().format(v.DATE_FORMAT),
                        });
                        replyWithHTML(
                            `<b>SUCCESSFULLY WITHDRAW .</b>\n\nThe withdraw amount should be in your account in seconds\n\nyou can check the transaction here: \nhttps://bithomp.com/explorer/${
                                result.hash
                            }`,
                            MAIN_MENU,
                        );
                    } else if (result && result.resultCode === 'error') {
                        replyWithHTML(
                            `<b>Failed to withdraw!\n\n${result.error.error.engine_result_message}</b>`,
                            MAIN_MENU,
                        );
                    } else {
                        replyWithHTML(`<b>Failed to withdraw. please report the problem.</b>`, MAIN_MENU);
                    }
                } catch (err) {
                    logger.error(`Withdraw Error - ${err}`);
                    replyWithHTML(`<b>Something is wrong , please report the problem.</b>`, MAIN_MENU);
                } finally {
                    // unlock after everything is done
                    unlock();
                    ctx.deleteMessage();
                    ctx.scene.leave();
                }
            }),
        );

        return stepFourHandler;
    }

    async setWizard() {
        await this.stage.register(
            new WizardScene(
                'withdraw',
                ctx => {
                    ctx.replyWithHTML(
                        'Welcome to the withdrawal process of XRP Bot\n\nPlease respond to us with a valid <b>XRP</b> withdrawal address.',
                        CANCEL_MENU,
                    );
                    return ctx.wizard.next();
                },
                this.stepOne(),
                ctx => {
                    ctx.replyWithHTML(
                        'Please enter <b>Destination Tag</b> for this withdrawal address:\n\nNote: For pass/ignore please enter "0"',
                        CANCEL_MENU,
                    );
                    return ctx.wizard.next();
                },
                this.stepTwo(),
                ctx => {
                    ctx.replyWithHTML('How much <b>XRP</b> do you want to withdraw?', CANCEL_MENU);
                    return ctx.wizard.next();
                },
                this.stepThree(),
                ctx => {
                    const { state } = ctx.scene.session;
                    let content = '';
                    if (state.destination_tag != 0) {
                        content = `<b>CONFIRM</b>\n\nYou want to withdraw <b>${state.amount} XRP</b> to <b>${
                            state.address
                        }</b> with Destanation Tag <b>${state.destination_tag}</b>\n\nis this correct?`;
                    } else {
                        content = `<b>CONFIRM</b>\n\nYou want to withdraw <b>${state.amount} XRP</b> to <b>${
                            state.address
                        }</b> \n\nis this correct?`;
                    }
                    ctx.replyWithHTML(
                        content,
                        Markup.inlineKeyboard([
                            Markup.callbackButton('Yes', 'confirm-withdraw-yes'),
                            Markup.callbackButton('No', 'confirm-withdraw-no'),
                        ]).extra(),
                    );
                    return ctx.wizard.next();
                },
                this.stepFour(),
                ctx => {
                    const { state } = ctx.scene.session;
                    ctx.replyWithHTML('done');
                },
            ),
        );
    }

    setHandler() {
        this.app.hears(
            '⬆️ Withdraw',
            Composer.privateChat(async ctx => {
                const { scene } = ctx;
                scene.enter('withdraw');
            }),
        );
    }
}

module.exports = WithdrawHandler;
