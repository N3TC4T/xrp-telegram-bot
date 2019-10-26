require('dotenv').config();

const Composer = require('telegraf/composer');
const Markup = require('telegraf/markup');
const WizardScene = require('telegraf/scenes/wizard');

//utils
const _ = require('lodash');

//libs
const address_codec = require('ripple-address-codec');

const CANCEL_TEXT = '🔙 Back';
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

class WalletHandler {
    constructor(app, db, stage) {
        this.app = app;
        this.db = db;
        this.ctx = null;
        this.stage = stage;
    }

    Cancel(ctx) {
        try {
            const { replyWithHTML } = ctx;
            return replyWithHTML('ℹ️ Main Menu.', MAIN_MENU);
        } catch (e) {
            console.log(e);
        }
    }

    Menu(ctx) {
        ctx.replyWithHTML(
            'Wallet Notify Settings',
            Markup.keyboard([['➕ Add Wallet', '📇 Manage Wallets'], [CANCEL_TEXT]])
                .resize()
                .extra(),
        );
        ctx.deleteMessage().catch(e => {});
        ctx.scene.leave();
    }

    addHandler() {
        const addHandler = new Composer();
        addHandler.hears(CANCEL_TEXT, Composer.privateChat(this.Menu));
        addHandler.on(
            'message',
            Composer.privateChat(async ctx => {
                const message = ctx.update.message.text;
                if (!address_codec.isValidAddress(message)) {
                    return ctx.reply('⚠️ Please enter a correct XRP address.');
                }

                const userModel = new this.db.User();
                const user = await userModel.getUser(ctx);

                const walletNotifyModel = new this.db.WalletNotify();
                const status = await walletNotifyModel.activeNotify(user.id, message);
                if (status) {
                    await ctx.replyWithHTML(
                        `✅ Wallet Address <b>${message}</b> successfully added.\nAfter this You will get notification on payment transactions on this wallet.`,
                    );
                } else {
                    await ctx.replyWithHTML(`Wallet Address <b>${message}</b> is already in your notify list.`);
                }

                this.Menu(ctx);
            }),
        );
        return addHandler;
    }

    listHandler() {
        const listHandler = new Composer();
        listHandler.hears(CANCEL_TEXT, Composer.privateChat(this.Menu));
        listHandler.on(
            'message',
            Composer.privateChat(async ctx => {
                const text = ctx.message.text;
                if (text === '📇 Manage Wallets') {
                    const MENU = [];
                    const userModel = new this.db.User();
                    const user = await userModel.getUser(ctx);
                    const wallets = await this.db.WalletNotify.findAll({
                        where: { for_user: user.id, active: true },
                    });
                    wallets.forEach(s => {
                        MENU.push([s.address]);
                    });
                    MENU.push([CANCEL_TEXT]);
                    return ctx.replyWithHTML(
                        'Please choose a wallet address to delete:',
                        Markup.keyboard(MENU)
                            .resize()
                            .extra(),
                    );
                }

                const userModel = new this.db.User();
                const user = await userModel.getUser(ctx);
                const wallet = await this.db.WalletNotify.findOne({
                    where: { address: text, for_user: user.id },
                });
                if (!wallet) {
                    return ctx.replyWithHTML('⚠️ Please select a wallet from list!', CANCEL_MENU);
                }

                //set wallet notify id
                ctx.scene.session.state.id = wallet.id;

                ctx.replyWithHTML(
                    `Are you sure you want to delete wallet address : <b>${
                        wallet.address
                    }</b> ?\n\nYou will not get any notify on this address anymore.`,
                    Markup.inlineKeyboard([
                        Markup.callbackButton('Yes', 'confirm-delete-wallet-yes'),
                        Markup.callbackButton('No', 'confirm-delete-wallet-no'),
                    ]).extra(),
                );

                ctx.wizard.next();
            }),
        );

        return listHandler;
    }

    deleteHandler() {
        const deleteHandler = new Composer();

        deleteHandler.hears(CANCEL_TEXT, Composer.privateChat(this.Menu));
        deleteHandler.action('confirm-delete-wallet-no', Composer.privateChat(this.Menu));

        deleteHandler.action(
            'confirm-delete-wallet-yes',
            Composer.privateChat(ctx => {
                const { state } = ctx.scene.session;

                const walletNotifyModel = new this.db.WalletNotify();
                walletNotifyModel.deactiveNotify(state.id);
                ctx.replyWithHTML('✅ Wallet Successfully removed!');
                this.Menu(ctx);
            }),
        );
        return deleteHandler;
    }

    backHandler() {
        const handler = new Composer();
        handler.hears(CANCEL_TEXT, Composer.privateChat(this.Menu));
        return handler;
    }
    async setWizard() {
        // Wallet notify add wizard
        this.stage.register(
            new WizardScene(
                'wallet_notify_add',
                ctx => {
                    ctx.replyWithHTML(
                        "Please enter XRP wallet address you want to add :\n\n⚠️ Do not enter address's that belongs to <b>Exchanges</b>",
                        CANCEL_MENU,
                    );
                    ctx.wizard.next();
                },
                this.addHandler(),
            ),
        );
        // Wallet notify delete wizard
        this.stage.register(
            new WizardScene('wallet_notify_delete', this.backHandler(), this.listHandler(), this.deleteHandler()),
        );
    }

    setHandler() {
        this.app.hears(CANCEL_TEXT, Composer.privateChat(this.Cancel));
        this.app.hears(
            '➕ Add Wallet',
            Composer.privateChat(ctx => {
                const { scene } = ctx;
                scene.enter('wallet_notify_add');
            }),
        );

        this.app.hears(
            '📇 Manage Wallets',
            Composer.privateChat(ctx => {
                const { scene } = ctx;
                scene.enter('wallet_notify_delete');
            }),
        );
    }
}

module.exports = WalletHandler;
