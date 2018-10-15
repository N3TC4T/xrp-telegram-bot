require("dotenv").config();

//utils
const _ = require("lodash");
const moment = require("moment");

//libs
const address_codec = require('ripple-address-codec');
const ripple = require('../lib/ripple');
const logger = require('../lib/loggin');

//constants
const v = require("../config/vars");

class WithdrawCommand {
    constructor(app, db) {
        this.app = app;
        this.db = db;
        this.ctx = null;
        this.setCommand()
    }


    async sendWithdraw(ctx){
        const {replyWithHTML} = ctx;
        let {withdraw} = ctx.session;

        if(!withdraw){
            return replyWithHTML(`<b>There is no withdraw to confirm!</b>`)
        }

        withdraw = JSON.parse(withdraw);

        const unlock = await ctx.session.lock();

        try {

            const userModel = new this.db.User ;
            const user = await userModel.getUser(ctx);


            if(parseFloat(user.balance) < parseFloat(withdraw.amount) ) {
                return replyWithHTML(
                    "<b>Your balance changed during withdraw , please create a new withdraw request!</b>"
                )
            }

            const result = await ripple.payment(withdraw);

            logger.info(`Payment - ${JSON.stringify(result)}`);


            if(result && (result.resultCode === 'tesSUCCESS' || result.resultCode === 'terQUEUED')){

                logger.info(`Withdraw - ${withdraw.address}:${withdraw.destination_tag} ${withdraw.amount} - ${user.username}:${user.id}:`);

                // decrease user Balance
                await userModel.decreaseBalance(user, withdraw.amount);

                // create deposit record
                await this.db.Withdraw.create({
                    to_address: withdraw.address,
                    destination_tag: withdraw.destination_tag,
                    amount: withdraw.amount,
                    tx_hash: result.id,
                    for_user: user.id,
                    result: JSON.stringify(result),
                    datetime : moment().format(v.DATE_FORMAT)
                });
                return replyWithHTML(`<b>SUCCESSFULLY WITHDRAW .</b>\n\nThe withdraw amount should be in your account in seconds\n\nyou can check the transaction here: \https://xrpcharts.ripple.com/#/transactions/${result.id}`)
            }else{
                return replyWithHTML(`<b>Failed to withdraw. please report the problem.</b>`)
            }

        }
        catch(err) {
            logger.error(`Withdraw Error - ${err}`);
            return replyWithHTML(`<b>Something is wrong , please report the problem.</b>`)
        }
        finally {
            // unlock after everything is done
            // ctx.session.lock = null ;
            ctx.session.withdraw = null;
            unlock();
        }

    }

    cancelWithdraw(ctx){
        const { replyWithHTML } = ctx ;
        ctx.session.withdraw = null;
        return replyWithHTML(`✅ <b>withdraw successfully canceled!</b>`)
    }


    setWithraw(data){
        this.ctx.session.withdraw = data
    }

    setCommand() {
        this.app.command(['withdraw', 'confirm', 'cancel'], async(ctx) => {
            const {replyWithHTML } = ctx;

            this.ctx = ctx;

            // can not run this command in groups
            const chat_type = _.get(ctx, ['update', 'message', 'chat', 'type']);
            if(chat_type !== 'private'){
                return replyWithHTML(`<b>This type of command is not available in ${chat_type}!</b>`)
            }

            const { command } = ctx.state.command;
            if(command === 'confirm'){
                return await this.sendWithdraw(ctx)
            }else if(command === 'cancel'){
                return this.cancelWithdraw(ctx)
            }

            const args = ctx.state.command.splitArgs;

            // check stuff
            if (args.length >= 2 ) {
                const unlock = await ctx.session.lock();

                try {

                    let amount = args[0];
                    const address = args[1];
                    const destination_tag = args[2] || 0;

                    if (!address_codec.isValidAddress(address)) {
                        return replyWithHTML(`<b>Invalid Ripple Address</b>`)
                    }

                    if (destination_tag && isNaN(parseInt(destination_tag))) {
                        return replyWithHTML(`<b>Invalid Destination Tag, just numbers allowed</b>`)
                    }


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
                        if(parseFloat(amount) < 0.1)
                        {
                            return replyWithHTML(`<b>The minimum amount to withdraw is 0.1 XRP!</b>`)
                        }
                        if (parseFloat(user.balance) < parseFloat(amount)) {//Insufficient fund
                            return replyWithHTML(`<b>Insufficient Balance</b>`)
                        }
                    }

                    // set withdraw to session

                    ctx.session.withdraw = JSON.stringify({
                        source_tag: user.telegramId,
                        amount,
                        address,
                        destination_tag
                    });

                    return replyWithHTML(
                        `<b>CONFIRM WITHDRAW</b>\n\n<b>${amount} XRP</b> will be debited from your account and sent to \n\nAddress: <code>${address}</code>\nDestination tag: <code>${destination_tag}</code>\n\n For confirm this actions use /confirm command\n For cancel use /cancel command`
                    )

                }
                catch (err) {
                    logger.error(`Withdraw Error - ${err}`);
                    return replyWithHTML(`<b>Something is wrong , please report the problem.</b>`)
                }
                finally {
                    // unlock after everything is done
                    unlock()
                }

            }else{
                return replyWithHTML(
                    `<b>Invalid arguments</b>\n\nPlease use like this : \n<pre>/withdraw amount address destination_tag</pre>\nTip:\n* For withdraw all your amount you can use "all" in amount argument\n* Destination tag is optional  `
                )
            }
        })
    }
}

module.exports = WithdrawCommand;
