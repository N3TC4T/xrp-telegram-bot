require('dotenv').config();

const Telegraf = require('telegraf');

const v = require(__dirname+'../config/vars');
const db = require('../models/index');

// init bot
const bot = new Telegraf(process.env.BOT_TOKEN);

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

let counter = 0;

db.User.findAll().then((users) => {
    users.forEach(async (user) => {
        if(counter === 30){
            await sleep(1000);
            counter = 0
        }else{
            counter += 1
        }
        if(user.telegramId){
            try{
                bot.telegram.sendMessage(user.telegramId,
                    `<b>Attention!</b>\n\nTHE BOT USERNAME CHANGED FROM @RippledBot TO @XRPBot .\n\nSo please after this time use @XRPBot as the bot username.\n\nIf you have any further questions, please contact at @n3tc4t .\n<b>Regards</b>`,
                    {parse_mode: 'HTML'}
                ).then(() => console.log(`Sent Broadcast for user ${user.telegramId}`)
                ).catch(() => console.log(`Broadcast Failed for user ${user.telegramId}`));
            }catch (e) {
                console.log(`Broadcast Failed for user ${user.telegramId}`)
            }

        }
    });
    bot.stop()
})


