require("dotenv").config();

// utils
const moment = require('moment');
const chalk = require('chalk');
const logger = require('../lib/loggin');
const express = require('express')
const bodyParser = require('body-parser')

// constant
const v = require("../config/vars");


class WebhookListener {
    constructor(bot, db) {
        this.api = null;
        this.bot = bot;
        this.db = db;
        this.start()
    }


    async handle(ev){

        try{
            const { transaction } = ev;

            const { Destination }  = transaction

            let amount = parseFloat(transaction.Amount) / 1000000;
            if (ev.meta && typeof ev.meta.delivered_amount !== 'undefined') {
                amount = parseFloat(ev.meta.delivered_amount)  / 1000000
            }
            if (ev.meta && typeof ev.meta.DeliveredAmount !== 'undefined') {
                amount = parseFloat(ev.meta.DeliveredAmount)  / 1000000
            }

            const wallets = await this.db.WalletNotify.findAll({where: {address: Destination, active: true } })

            if(!wallets) return

            wallets.forEach(async wallet => {
                const user = await this.db.User.findOne({where: {id: wallet.for_user}});

                this.bot.telegram.sendMessage(user.telegramId,
                    `<pre>🔔 Wallet Notify</pre>\n\nFrom: <code> ${transaction.Account}</code>\nTo: <code> ${transaction.Destination}</code>\nAmount: <code>${amount}</code> XRP\n\nYou can disable this messages in notificatons settings.\n\nhttps://bithomp.com/explorer/${transaction.hash}`,
                    {parse_mode: 'HTML'}
                ).catch((e) => { console.log(`can not send wallet notify for user: ${user.telegramId}`)})
            });

         }catch(e) { console.log(e)}
        
    }

    start() {
        const app = express()
        app.use(bodyParser.json())
        app.post('/xrpl/webhook', async (req, res) => {
            try{
                await this.handle(req.body)
            }catch(e) { console.log(e)}
            
            res.sendStatus(200)
          })
          
          app.listen(4000, () => console.log("---", chalk.green("Started Webhook Listener on port 4000")) )
    }

}

module.exports = WebhookListener;
