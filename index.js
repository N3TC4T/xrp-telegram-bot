require('dotenv').config();

// Telegraf
const Telegraf = require('telegraf');
const Stage = require("telegraf/stage");
const commandParts = require('telegraf-command-parts');
const RedisSession = require('./lib/session');

// libs
const chalk = require('chalk');
const logger = require('./lib/loggin');
const glob = require( 'glob' );
const path = require( 'path' );

// constants
const v = require(__dirname + '/config/vars');
const db = require('./models/index');

// defines
const userModel = new db.User ;
const groupModel = new db.Group ;
const _DEV_ = process.env.NODE_ENV === 'development';



/** Init bot */
const bot = new Telegraf(_DEV_ ? process.env.BOT_TOKEN_DEVELOPMENT : process.env.BOT_TOKEN );
// Set bot username
bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username
});

console.log("Starting", chalk.magenta(`${v.BOT_NAME_HUMAN} v${ v.BOT_VERSION} ${_DEV_? '[Development]': ''}`));
console.log("---", chalk.cyan(new Date()));


/** Using REDIS Instead of JS Memory */
const session = new RedisSession({
    store: {
        host: process.env.TELEGRAM_SESSION_HOST || '127.0.0.1',
        port: process.env.TELEGRAM_SESSION_PORT || 6379
    },
    getSessionKey: ctx => ctx.from.id
});


/** Error handling */
bot.catch((err) => {
    logger.error(err);
});



/** Command lists here */
const handlersList = [];
glob.sync( './handlers/**/*.js' ).forEach( function( file ) {
    handlersList.push(require( path.resolve( file ) ));
});


/** Define Wizards */
const stage = new Stage();
handlersList.forEach((d) => {
    const h = new d(bot, db, stage);
    if(typeof h.setWizard === 'function') {
        h.setWizard()
    }
});


/** Middleware */
bot.use(session.middleware());
bot.use(stage.middleware());
bot.use(commandParts());
bot.use((ctx, next) => userModel.updateUser(ctx, next));
bot.use((ctx, next) => groupModel.updateGroup(ctx, next));


/** set Handlers */
handlersList.forEach((d) => {
    const h = new d(bot, db, stage);
    if(typeof h.setHandler === 'function') {
        h.setHandler()
    }
});


/** Jobs */
glob.sync( './listener/**/*.js' ).forEach( function( file ) {
    const l = require( path.resolve( file ) );
    new l(bot,db)
});


/** Start the bot */
bot.startPolling();



