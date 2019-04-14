require('dotenv').config();

// libs
const { Composer } = require('telegraf');

// utils
const _ = require('lodash');
const moment = require('moment');
const logger = require('../../lib/loggin');

// constants
const v = require('../../config/vars');

// some hard coded groups
const EXCLUDE_GROUPS = [-286577446, -1001180991966, -1001232049586, -1001146345213];

class TipHandler {
    constructor(app, db) {
        this.app = app;
        this.db = db;
    }

    setHandler() {
        this.app.command(
            ['tip', 'xrp'],
            Composer.groupChat(async ctx => {
                const { replyWithHTML } = ctx;
                const args = ctx.state.command.splitArgs;
                const { command } = ctx.state.command;
                const self = this;

                let chat = null;
                if (ctx.updateType === 'callback_query') {
                    chat = ctx.update.callback_query.message.chat;
                } else {
                    if (_.has(ctx, ['update', 'message', 'chat'])) {
                        chat = ctx.update.message.chat;
                    }
                }

                // exclude groups with certain ids
                if (command === 'tip' && EXCLUDE_GROUPS.includes(chat.id)) {
                    return;
                }

                // check stuff
                if (args.length === 2) {
                    const unlock = await ctx.session.lock();

                    try {
                        const amount = args[0].replace('+', '');
                        const username = args[1].replace('@', '');

                        const userModel = new self.db.User();

                        const from_user = await userModel.getUser(ctx);

                        if (!from_user) {
                            return replyWithHTML(`⚠️ You need to login to the bot before sending tip to other users.`);
                        }

                        if (from_user.balance === 0) {
                            return replyWithHTML(
                                "⚠️ You don't have any XRP in your account , please deposit some XRP first!",
                            );
                        }

                        if (!/[a-z0-9/_]{5,32}/.test(username)) {
                            return replyWithHTML(
                                `️️️️️️️️️️️️️️️⚠️ Invalid Username, please enter a valid telegram username!`,
                            );
                        }

                        if (!/^[+-]?\d+(\.\d+)?$/.test(amount)) {
                            return replyWithHTML(`⚠️ Invalid Amount, please enter a valid tip amount!`);
                        } else {
                            //valid amount
                            if (parseFloat(amount) < 0.000001) {
                                return replyWithHTML(`⚠️ The minimum amount to tip is <b>0.000001</b> XRP!`);
                            }
                            if (parseFloat(from_user.balance) < parseFloat(amount)) {
                                //Insufficient fund
                                return replyWithHTML(
                                    `⚠️ <b>Insufficient Balance</b>, Please deposit some $XRP before tiping!`,
                                );
                            }
                        }

                        if (from_user.username) {
                            if (from_user.username.toLowerCase() === username.toLowerCase()) {
                                return replyWithHTML(`You can not tip to yourself :)`);
                            }
                        }

                        const to_user = await userModel.getUserByUsername(username);

                        logger.info(
                            `Tip - ${from_user.username}:${from_user.id} -> ${to_user.username}:${
                                to_user.id
                            } - ${amount}`,
                        );

                        // change balances
                        const sender_balance = await userModel.decreaseBalance(from_user, amount);
                        const recipient_balance = await userModel.increaseBalance(to_user, amount);

                        const datetime = moment().format(v.DATE_FORMAT);

                        // create transaction
                        await self.db.Transaction.create({
                            amount,
                            type: 'tip',
                            sender_username: from_user.username,
                            recipient_username: to_user.username,
                            from_user: from_user.id,
                            to_user: to_user.id,
                            datetime,
                        });

                        const marketModel = new self.db.Market();
                        const toUSD = await marketModel.calculate(amount, 'USD');

                        if (toUSD == 0) {
                            return replyWithHTML(
                                `@${
                                    to_user.username
                                } - 🎉 Woohoo, You have received a tip: <b>${amount} XRP</b> from @${
                                    from_user.username
                                }`,
                            );
                        } else {
                            return replyWithHTML(
                                `@${
                                    to_user.username
                                } - 🎉 Woohoo, You have received a tip: <b>${amount} XRP</b> (${toUSD} USD) from @${
                                    from_user.username
                                }`,
                            );
                        }
                    } catch (err) {
                        logger.error(`Send Error - ${err}`);
                        return replyWithHTML(`<b>Something is wrong , please report the problem.</b>`);
                    } finally {
                        unlock();
                    }
                } else {
                    const out = `<b>Invalid arguments</b>\n\nPlease use this format to send tip: \n<pre>/tip +2 @username</pre>`;
                    return replyWithHTML(out);
                }
            }),
        );
    }
}

module.exports = TipHandler;
