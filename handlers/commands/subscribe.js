require('dotenv').config();

const _ = require('lodash');
const { admin, Composer } = require('telegraf');

class SubscribeHandler {
    constructor(app, db) {
        this.app = app;
        this.db = db;
    }

    setHandler() {
        this.app.command(
            'subscribe',
            Composer.groupChat(
                admin(async ctx => {
                    const { replyWithMarkdown } = ctx;
                    let from = null;
                    let update = null;

                    const chat_type = _.get(ctx, ['update', 'message', 'chat', 'type']);

                    if (chat_type !== 'private') {
                        let chat = null;
                        if (ctx.updateType === 'callback_query') {
                            chat = ctx.update.callback_query.message.chat;
                        } else {
                            if (_.has(ctx, ['update', 'message', 'chat'])) {
                                chat = ctx.update.message.chat;
                            }
                        }
                        from = chat;
                    } else {
                        if (ctx.updateType === 'callback_query') {
                            update = ctx.update.callback_query;
                            from = update.from;
                        } else {
                            update = ctx.update;
                            if (_.has(ctx, ['update', 'message', 'from'])) {
                                from = ctx.update.message.from;
                            }
                        }
                    }

                    const subscriptionsModel = new this.db.Subscriptions();

                    const result = await subscriptionsModel.setSettings(from.id, true);
                    if (result) {
                        replyWithMarkdown(
                            `Successfully ***subscribe*** to XRP Community Blog.\nFor unsubscribe please use \/unsubscribe command`,
                        );
                    } else {
                        replyWithMarkdown(
                            `Already ***subscribed*** to XRP Community Blog!\nFor unsubscribe please use \/unsubscribe command`,
                        );
                    }
                }),
            ),
        );

        this.app.command(
            'unsubscribe',
            Composer.groupChat(
                admin(async ctx => {
                    const { replyWithMarkdown } = ctx;
                    let from = null;
                    let update = null;

                    const chat_type = _.get(ctx, ['update', 'message', 'chat', 'type']);

                    if (chat_type !== 'private') {
                        let chat = null;
                        if (ctx.updateType === 'callback_query') {
                            chat = ctx.update.callback_query.message.chat;
                        } else {
                            if (_.has(ctx, ['update', 'message', 'chat'])) {
                                chat = ctx.update.message.chat;
                            }
                        }
                        from = chat;
                    } else {
                        if (ctx.updateType === 'callback_query') {
                            update = ctx.update.callback_query;
                            from = update.from;
                        } else {
                            update = ctx.update;
                            if (_.has(ctx, ['update', 'message', 'from'])) {
                                from = ctx.update.message.from;
                            }
                        }
                    }

                    const subscriptionsModel = new this.db.Subscriptions();

                    const result = await subscriptionsModel.setSettings(from.id, false);
                    if (result) {
                        replyWithMarkdown(`Successfully ***unsubscribe*** from XRP Community Blog.`);
                    } else {
                        replyWithMarkdown(`Already ***unsubscribed*** from XRP Community Blog!`);
                    }
                }),
            ),
        );
    }
}

module.exports = SubscribeHandler;
