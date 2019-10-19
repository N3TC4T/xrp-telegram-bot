require('dotenv').config();

const Telegraf = require('telegraf');

const v = require('../config/vars');
const db = require('../models/index');

const message = ``;
// init bot
const bot = new Telegraf(process.env.BOT_TOKEN_DEVELOPMENT);
// consts
const perRound = 20;
const sleepMs = 1000;

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

let counter = 0;
let totalBroadCast = 0;
let totalFail = 0;

db.User.findAll().then(users => {
    users.forEach(async user => {
        if (counter === perRound) {
            await sleep(sleepMs);
            counter = 0;
        } else {
            counter += 1;
        }
        if (user.telegramId) {
            try {
                bot.telegram
                    .sendMessage(user.telegramId, message, { parse_mode: 'HTML' })
                    .then(() => (totalBroadCast += 1))
                    .catch(() => (totalFail += 1));
            } catch (e) {
                totalFail += 1;
            }
        }
    });
});

console.log('Result: ');
console.log(`Total Sent: ${totalBroadCast}`);
console.log(`Total Failed: ${totalFail}`);
