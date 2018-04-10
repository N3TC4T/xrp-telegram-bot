require('dotenv').config();

const Telegraf = require('telegraf');
const commandParts = require('telegraf-command-parts');
const RedisSession = require('./lib/session');
const DepositListener = require('./listener/deposit');

const chalk = require('chalk');

const v = require(__dirname+'/config/vars');
const db = require('./models/index');

const logger = require('./lib/loggin');

const userModel = new db.User ;
const groupModel = new db.Group ;
const logModel = new db.Log;


// init bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Set bot username
bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username
});

console.log("Starting", chalk.magenta(v.BOT_NAME_HUMAN + " v" + v.BOT_VERSION));
console.log("---", chalk.cyan(new Date()));

/** Command lists here */
const commandList = [
    require('./commands/start'),
    require('./commands/help'),
    require('./commands/send'),
    require('./commands/deposit'),
    require('./commands/balance'),
    require('./commands/withdraw'),
];

/** Using REDIS Instead of JS Memory */
const session = new RedisSession({
    store: {
        host: process.env.TELEGRAM_SESSION_HOST || '127.0.0.1',
        port: process.env.TELEGRAM_SESSION_PORT || 6379
    },
    getSessionKey: ctx => ctx.from.id
});
bot.use(session.middleware());
bot.use(commandParts());

/** Managing Middleware for records session or anything */
bot.use((ctx, next) => userModel.updateUser(ctx, next));
bot.use((ctx, next) => groupModel.updateGroup(ctx, next));
bot.use((ctx, next) => logModel.toLog(ctx, next));


bot.catch((err) => {
    logger.error(err);
});

commandList.forEach((d) => {
    new d(bot, db);
});

new DepositListener(bot,db);

bot.startPolling();



