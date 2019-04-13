require("dotenv").config();

// utils
const moment = require('moment');
const chalk = require('chalk');
const logger = require('../lib/loggin');

// ripple-lib
const RippledWsClient = require('rippled-ws-client')

// constant
const v = require("../config/vars");
const _DEV_ = process.env.NODE_ENV === 'development';


class DepositListener {
    constructor(bot, db) {
        this.bot = bot;
        this.db = db;
        this.wsURL = _DEV_ ? 'wss://s.altnet.rippletest.net:51233' : 'wss://s1.ripple.com:443' ;

        this.onTransaction = this.onTransaction.bind(this)
        this.connect()
    }


    async onTransaction(ev){

        const { transaction } = ev;

        if (process.env.WALLET_ADDRESS === transaction.Destination && transaction.DestinationTag) {
            logger.info(`Deposit - ${JSON.stringify(ev)}`);

	    let amount = parseFloat(transaction.Amount) / 1000000;
            if (ev.meta && typeof ev.meta.delivered_amount !== 'undefined') {
              amount = parseFloat(ev.meta.delivered_amount)  / 1000000
            }
            if (ev.meta && typeof ev.meta.DeliveredAmount !== 'undefined') {
               amount = parseFloat(ev.meta.DeliveredAmount)  / 1000000
            }

            const userID = transaction.DestinationTag;

            const userModel = new this.db.User;
            const user = await userModel.getUserByID(userID);
            await userModel.increaseBalance(user, amount);

            // create deposit record
            await this.db.Deposit.create({
                from_address: transaction.Account,
                destination_tag: transaction.DestinationTag,
                amount,
                tx_hash: transaction.hash,
                for_user: user.id,
                datetime : moment().format(v.DATE_FORMAT)
            });

            this.bot.telegram.sendMessage(userID,
                `<pre>Deposit Complete</pre>\n\nAmount: <code>${amount}</code> XRP\nFrom: <code> ${transaction.Account}</code>\n\nhttps://bithomp.com/explorer/${transaction.hash}`,
                {parse_mode: 'HTML'}
            )
        }
    }

    connect(){
        try{
            new RippledWsClient(this.wsURL).then((Connection) => {
                console.log("---", chalk.green(`Connected to Ripple server ${this.wsURL}`));
              
                Connection.send({
                  command: 'subscribe',
                  accounts: [ process.env.WALLET_ADDRESS ]
                }).then((r) => {
                    console.log("---", chalk.green(`Subscribed to address ${process.env.WALLET_ADDRESS }`));
                }).catch((e) => {
                  console.log('subscribe Catch', e)
                })
    
                Connection.on('transaction', this.onTransaction)
    
                Connection.on('error', (error) => {
                    logger.error(`EVENT=error: Error ${error}` )
                })
                Connection.on('state', (stateEvent) => {
                    console.info('EVENT=state: State is now', stateEvent)
                })
                Connection.on('retry', (retryEvent) => {
                    console.log('EVENT=retry: << Retry connect >>', retryEvent)
                })
                Connection.on('reconnect', (reconnectEvent) => {
                    console.log('EVENT=reconnect: << Reconnected >>', reconnectEvent)
                })
                Connection.on('close', (closeEvent) => {
                    console.log('EVENT=close: Connection closed', closeEvent)
                })
            })
        }catch(e) {
            console.log(`RippledWsClient ERROR ${e}`)
        }
    }
}

module.exports = DepositListener;
