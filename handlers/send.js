require("dotenv").config();

// utils
const _ = require("lodash");
const moment = require("moment");
const logger = require('../lib/loggin');

// constants
const v = require("../config/vars");

class SendCommand {
    constructor(app, db) {
        this.app = app;
        this.db = db;
        this.setCommand()
    }

    setCommand() {
        this.app.command(['send', 'tip'], async(ctx) => {
            const {replyWithHTML } = ctx;

            const { command } = ctx.state.command;
            const chat_type = _.get(ctx, ['update', 'message', 'chat', 'type']);

            if((chat_type !== 'private' && command === 'send') || (chat_type === 'private' && command !== 'send') ){
                return replyWithHTML(`<b>This type of command is not available in ${chat_type}!</b>`)
            }

            const args = ctx.state.command.splitArgs;

            const self = this;

            // check stuff
            if (args.length === 2 ) {
                    const unlock = await ctx.session.lock();

                    try {

                        const amount = args[0].replace('+', '');
                        const username = args[1].replace('@', '');

                        const userModel = new self.db.User;

                        const from_user = await userModel.getUser(ctx);

                        if(!from_user){
                            return replyWithHTML(
                                `${ctx.from.username} You need to login to the bot before sending tip to other users.`
                            )
                        }

                        if (from_user.balance === 0) {
                            return replyWithHTML(
                                "You don't have any XRP in your account , deposit with /deposit command"
                            )
                        }

                        if(!username || username.length < 5){
                            return replyWithHTML(`<b>Invalid Username!</b>`)
                        }


                        if (!/^[+-]?\d+(\.\d+)?$/.test(amount)) {
                            return replyWithHTML(`<b>Invalid Amount</b>`)
                        } else {//valid amount
                            if(parseFloat(amount) < 0.000001){
                                return replyWithHTML(`<b>The minimum amount to send/tip is 0.000001 XRP!</b>`)
                            }
                            if (parseFloat(from_user.balance) < parseFloat(amount)) {//Insufficient fund
                                return replyWithHTML(`<b>Insufficient Balance</b>`)
                            }
                        }

                        if(from_user.username.toLowerCase() === username.toLowerCase()){
                            return replyWithHTML(`<b>You can not send/tip to yourself!</b>`)
                        }


                        const to_user = await userModel.getUserByUsername(username);

                        logger.info(`Send - ${from_user.username}:${from_user.id} -> ${to_user.username}:${to_user.id} - ${amount}`);

                        // change balances
                        const sender_balance = await userModel.decreaseBalance(from_user, amount);
                        const recipient_balance = await userModel.increaseBalance(to_user, amount);

                        const datetime = moment().format(v.DATE_FORMAT);

                        // create transaction
                        await self.db.Transaction.create({
                            amount,
                            type: command === 'tip' ? 'tip' : 'direct',
                            sender_username: from_user.username,
                            recipient_username: to_user.username,
                            from_user: from_user.id,
                            to_user: to_user.id,
                            datetime
                        });

                        // send message to recipient if there is any telegram id
                        if (to_user.telegramId && command !== 'tip') {
                            self.app.telegram.sendMessage(to_user.telegramId,
                                `<b>${amount}</b> XRP is received from @${from_user.username}\nYour new balance is <b>${recipient_balance} XRP</b>`,
                                {parse_mode: 'HTML'}
                            )
                        }

                        if (command === 'tip') {
                            return replyWithHTML(
                                `@${to_user.username} - You have received a tip: <b>${amount} XRP</b> from @${from_user.username}`
                            )
                        } else {
                            return replyWithHTML(
                                `✅ <b>${amount} XRP</b> Successfully sent to @${to_user.username}!`
                            )
                        }
                    }
                    catch (err) {
                        logger.error(`Send Error - ${err}`);
                        return replyWithHTML(`<b>Something is wrong , please report the problem.</b>`)
                    }
                    finally {
                        unlock()
                    }

            }else{
                const out = `<b>Invalid arguments</b>\n\nPlease use like this : \n<pre>/${command} +2 @username</pre>`;
                return replyWithHTML(out)
            }
        })
    }
}

module.exports = SendCommand;
