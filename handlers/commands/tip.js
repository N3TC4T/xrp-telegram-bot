require("dotenv").config();

// utils
const _ = require("lodash");
const moment = require("moment");
const logger = require('../../lib/loggin');

// constants
const v = require("../../config/vars");

class TipHandler {
    constructor(app, db) {
        this.app = app;
        this.db = db;
    }

    setHandler() {
        this.app.command(['tip'], async(ctx) => {
            const {replyWithHTML } = ctx;

            const { command } = ctx.state.command;
            const chat_type = _.get(ctx, ['update', 'message', 'chat', 'type']);

            if(chat_type === 'private'){
                return replyWithHTML(`This command just works in <b>groups!</b>, Please use <b>Send</b> option in order to send XRP to another user`)
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
                            "You don't have any XRP in your account , please deposit some XRP first!"
                        )
                    }

                    if(!username || username.length < 5){
                        return replyWithHTML(`<b>Invalid Username!</b>`)
                    }


                    if (!/^[+-]?\d+(\.\d+)?$/.test(amount)) {
                        return replyWithHTML(`<b>Invalid Amount</b>`)
                    } else {//valid amount
                        if(parseFloat(amount) < 0.000001){
                            return replyWithHTML(`<b>The minimum amount to tip is 0.000001 XRP!</b>`)
                        }
                        if (parseFloat(from_user.balance) < parseFloat(amount)) {//Insufficient fund
                            return replyWithHTML(`<b>Insufficient Balance, Please deposit some $XRP before tiping! </b>`)
                        }
                    }

                    if(from_user.username){
                        if(from_user.username.toLowerCase() === username.toLowerCase()){
                            return replyWithHTML(`<b>You can not tip to yourself!</b>`)
                        }     
                    }

                    const to_user = await userModel.getUserByUsername(username);

                    logger.info(`Tip - ${from_user.username}:${from_user.id} -> ${to_user.username}:${to_user.id} - ${amount}`);

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
                        datetime
                    });


                    return replyWithHTML(
                        `@${to_user.username} - You have received a tip: <b>${amount} XRP</b> from @${from_user.username}`
                    )
                }
                catch (err) {
                    logger.error(`Send Error - ${err}`);
                    return replyWithHTML(`<b>Something is wrong , please report the problem.</b>`)
                }
                finally {
                    unlock()
                }

            }else{
                const out = `<b>Invalid arguments</b>\n\nPlease use this format to send tip: \n<pre>/tip +2 @username</pre>`;
                return replyWithHTML(out)
            }
        })
    }
}

module.exports = TipHandler;
