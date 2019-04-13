require('dotenv').config();

const Telegraf = require('telegraf');

const v = require('../config/vars');
const db = require('../models/index');

// init bot
const bot = new Telegraf(process.env.BOT_TOKEN_DEVELOPMENT);

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

let counter = 0;

db.User.findAll().then(users => {
    users.forEach(async user => {
        if (counter === 30) {
            await sleep(1000);
            counter = 0;
        } else {
            counter += 1;
        }
        if (user.telegramId) {
            try {
                bot.telegram
                    .sendMessage(
                        user.telegramId,
                        `<b>New Update 🎉</b>\n\nThe bot updated with new features, for applying the changes please use /start command \n\n<b>Whats news!</b>\n\n- New Menu instead of commands\n- Easier send and withraw proccess\n- Subscription to a XRP wallet and get notify on income transactions\n- Subscribe to XRP Community blog and get notify on new blog posts\n- Live market price in EUR/USD\n- Fixed bugs and making new bugs\n\nIf you have any further questions or you find a bug, please contact me at @N3TC4T\n\nThanks and Hope you enjoy working with bot 🤗`,
                        { parse_mode: 'HTML' },
                    )
                    .then(() => console.log(`Sent Broadcast for user ${user.telegramId}`))
                    .catch(() => console.log(`Broadcast Failed for user ${user.telegramId}`));
            } catch (e) {
                console.log(`Broadcast Failed for user ${user.telegramId}`);
            }
        }
    });
});
