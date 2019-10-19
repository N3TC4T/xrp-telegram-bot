require('dotenv').config();

const Telegraf = require('telegraf');

const db = require('../models/index');

// consts
const DEV = process.env.NODE_ENV === 'development';

// init bot
const bot = new Telegraf(DEV ? process.env.BOT_TOKEN_DEVELOPMENT : process.env.BOT_TOKEN);

checkExist = (telegramId, chatId) => {
    return bot.telegram
        .getChatMember(chatId, telegramId)
        .then(result => {
            if ('status' in result) {
                const { status, is_member } = result;
                if (status === 'left' || status === 'kicked') {
                    return false;
                }
                if (status === 'restricted' && !is_member) {
                    return false;
                }
                return true;
            }
        })
        .catch(e => {
            console.log(e);
            return false;
        });
};

db.UserGroup.findAll({
    include: [
        {
            model: db.Group,
            attributes: ['groupId'],
        },
        {
            model: db.User,
            attributes: ['telegramId'],
        },
    ],
}).then(userGroups => {
    userGroups.forEach(async userGroup => {
        const exists = await checkExist(userGroup.User.telegramId, userGroup.Group.groupId);
        if (!exists) {
            try {
                console.log(`Remove user ${userGroup.User.telegramId} from group ${userGroup.Group.groupId}`);
                await userGroup.destroy();
            } catch (err) {
                console.log(`Cannot remove user from group ${userGroup.id}`);
            }
        }
    });
});
