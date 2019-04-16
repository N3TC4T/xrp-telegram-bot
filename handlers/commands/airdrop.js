require('dotenv').config();

// libs
const { Composer } = require('telegraf');

// utils
const _ = require('lodash');
const moment = require('moment');
const logger = require('../../lib/loggin');

// constants
const v = require('../../config/vars');

const MAX_MESSAGE_LEN = 4096;

class AirdropHandler {
    constructor(app, db) {
        this.app = app;
        this.db = db;
    }

    getRandom(a, n) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a.slice(0, n);
    }

    setHandler() {
        this.app.command(
            ['airdrop'],
            Composer.groupChat(async ctx => {
                const { replyWithHTML } = ctx;

                const args = ctx.state.command.splitArgs;

                const self = this;

                if (args.length > 2) {
                    return;
                }

                // check stuff
                if (args.length === 2) {
                    const unlock = await ctx.session.lock();

                    try {
                        const amount = args[0].replace('+', '');
                        let count = args[1];

                        const userModel = new self.db.User();
                        const from_user = await userModel.getUser(ctx);

                        const groupModel = new self.db.Group();
                        const group = await groupModel.getGroup(ctx);

                        const userGroups = _.remove(group.UserGroups, n => {
                            return n.user !== from_user.id;
                        });

                        if (userGroups.length === 0) {
                            return replyWithHTML(
                                `⚠️ there is no known member of this group in the bot, Please try again in a little while and also be sure the bot have admin right!`,
                            );
                        }

                        if (!from_user) {
                            return replyWithHTML(`⚠️ You need to login to the bot before sending airdrops.`);
                        }

                        if (from_user.balance === 0) {
                            return replyWithHTML(
                                "⚠️ You don't have any XRP in your account , please deposit some XRP first!",
                            );
                        }

                        if (!/^[+-]?\d+(\.\d+)?$/.test(amount)) {
                            return replyWithHTML(`⚠️ Invalid Amount, please enter a valid amount!`);
                        }

                        if (!/^[+-]?\d+(\.\d+)?$/.test(count)) {
                            return replyWithHTML(`⚠️ Invalid user count, please enter a valid users count!`);
                        }

                        if (parseFloat(from_user.balance) < parseFloat(amount)) {
                            //Insufficient fund
                            return replyWithHTML(`⚠️ <b>Insufficient Balance</b>, Please deposit some $XRP first!`);
                        }

                        if (userGroups.length < count) {
                            count = userGroups.length;
                        }

                        const perUser = Math.round((parseFloat(amount) / count) * Math.pow(10, 6)) / Math.pow(10, 6);

                        //valid amount
                        if (perUser < 0.000001) {
                            return replyWithHTML(
                                `⚠️ The minimum amount to tip is <b>0.000001</b> XRP!\nPlease enter more amount or less airdrop number`,
                            );
                        }

                        const luckyUsers = this.getRandom(userGroups, count);

                        logger.info(
                            `Airdrop - ${from_user.username}:${from_user.id} - ${amount} XRP to ${
                                luckyUsers.length
                            } lucky member`,
                        );

                        // change balances for sender
                        await userModel.decreaseBalance(from_user, amount);

                        await Promise.all(
                            luckyUsers.map(async u => {
                                const { User } = u;
                                await userModel.increaseBalance(User, perUser);
                                const datetime = moment().format(v.DATE_FORMAT);

                                // create transaction
                                await self.db.Transaction.create({
                                    amount: perUser,
                                    type: 'airdrop',
                                    sender_username: from_user.username,
                                    recipient_username: User.username,
                                    from_user: from_user.id,
                                    to_user: User.id,
                                    datetime,
                                });
                            }),
                        );

                        let parts = [];
                        let index = 0;
                        let promises = [];

                        parts[index] = `Airdrop 🚀\nAirdropping <b>${amount} XRP</b> to <b>${count}</b> lucky member\n`;

                        luckyUsers.map(u => {
                            const { User } = u;
                            let temp = (parts[index] += `\n${perUser} XRP to @${User.username}`);
                            if (temp.length < MAX_MESSAGE_LEN) {
                                parts[index] = temp;
                            } else {
                                index += 1;
                                parts[index] = `${perUser} XRP to @${User.username}`;
                            }
                        });

                        for (let i = 0; i < parts.length; i++) {
                            promises.push(replyWithHTML(parts[i]));
                        }

                        return Promise.all(a);
                    } catch (err) {
                        logger.error(`Airdrop Error - ${err}`);
                        return replyWithHTML(`<b>Something is wrong , please report the problem.</b>`);
                    } finally {
                        unlock();
                    }
                } else {
                    return replyWithHTML(
                        `<b>Invalid arguments</b>\n\nPlease use this format to send airdrops: \n<pre>/airdrop +2 100</pre>`,
                    );
                }
            }),
        );
    }
}

module.exports = AirdropHandler;
