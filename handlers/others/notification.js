require('dotenv').config();
const _ = require('lodash');

const { Composer, Markup } = require('telegraf');

const CANCEL_TEXT = '🔙 Back';
const MAIN_MENU = Markup.keyboard([
    ['➡️ Send $XRP', '📈 Market'],
    ['⚖️ Balance', '⬇️ Deposit', '⬆️ Withdraw'],
    ['🔔 Notificaiton', '👥 Contact'],
])
    .resize()
    .extra();

class NotificationHandler {
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
            'Notifications Settings',
            Markup.keyboard([['ℹ️ Wallet Notify', 'ℹ️ Feed Notify'], [CANCEL_TEXT]])
                .resize()
                .extra(),
        );
        ctx.deleteMessage().catch(e => {});
        ctx.scene.leave().catch(e => {});
    }

    setHandler() {
        this.app.hears(CANCEL_TEXT, Composer.privateChat(this.Cancel));
        this.app.hears(
            '🔔 Notificaiton',
            Composer.privateChat(async ctx => {
                this.Menu(ctx);
            }),
        );
        this.app.hears(
            'ℹ️ Wallet Notify',
            Composer.privateChat(async ctx => {
                const { replyWithHTML } = ctx;
                return replyWithHTML(
                    'Wallet Notify Settings',
                    Markup.keyboard([['➕ Add Wallet', '📇 Manage Wallets'], [CANCEL_TEXT]])
                        .resize()
                        .extra(),
                );
            }),
        );
    }
}

module.exports = NotificationHandler;
