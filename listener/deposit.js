require("dotenv").config();

// utils
const moment = require('moment');
const chalk = require('chalk');
const logger = require('../lib/loggin');

// ripple-lib
const RippleAPI = require('ripple-lib').RippleAPI;

// constant
const v = require("../config/vars");


class DepositListener {
    constructor(bot, db) {
        this.api = null;
        this.bot = bot;
        this.db = db;
        this.connect()
    }


    async onTransaction(ev){

        const { transaction } = ev;

        if (process.env.WALLET_ADDRESS === transaction.Destination && transaction.DestinationTag) {
            logger.info(`Deposit - ${JSON.stringify(transaction)}`);

            const amount = parseFloat(transaction.Amount) / 1000000;
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
                `<pre>Deposit Complete</pre>\nAmount: <code>${amount}</code> XRP\nFrom: <code> ${transaction.Account}</code>\n\nhttps://xrpcharts.ripple.com/#/transactions/${transaction.hash}`,
                {parse_mode: 'HTML'}
            )
        }
    }

    onConnect() {
        console.log("---", chalk.green("Connected to Ripple Server [s.altnet.rippletest.net]"));

        // subscribe our wallet address
        this.api.connection.request({
            command: 'subscribe',
            accounts: [process.env.WALLET_ADDRESS],
        });


        // Subscribe for new transactions
        this.api.connection.on('transaction', ev => { this.onTransaction(ev) } )
    };

    onDisconnect(code) {
        console.log("---", chalk.red("Disconnected from Ripple server"));
    };

    connect() {
        if (this.api !== null) {
            this.api.disconnect();
        }

        this.api = new RippleAPI({ server: "wss://s1.ripple.com:443" });

        this.api.connect().then(() => {
            this.onConnect();
        });

        this.api.on('disconnected', code => {
            this.onDisconnect(code);
        });
    }

    disconnect() {
        if (this.api !== null) {
            this.api.disconnect();
        }
        this.api = null;
    }
}

module.exports = DepositListener;
