'use strict';
const moment = require("moment");
const v = require('./../config/vars');

module.exports = function (sequelize, DataTypes) {
    const Log = sequelize.define('Log', {
        telegramId: {
            type: DataTypes.BIGINT(255),
            allowNull: false
        },
        groupId: {
            type: DataTypes.BIGINT(255),
            allowNull: true
        },
        text: DataTypes.TEXT,
        updateType: DataTypes.STRING,
        raw: DataTypes.TEXT,
        datetime: DataTypes.DATE,
    });

    Log.associate = function (models) {
        // associations can be defined here
        Log.belongsTo(models.User, {
            targetKey: "telegramId",
            foreignKey: "telegramId"
        });
        Log.belongsTo(models.Group, {
            targetKey: "groupId",
            foreignKey: "groupId"
        })
    };


    Log.prototype.toLog =  function (ctx, next) {
        let from = null,
            chat = null,
            text = null,
            datetime = null,
            update = null;

        if (ctx.updateType === "callback_query") {
            update = ctx.update.callback_query;
            from = update.from
        } else {
            update = ctx.update;
            from = update.message.from
        }
        chat = update.message.chat;
        text = update.message.text && update.message.text;
        datetime = moment.unix(update.message.date).format(v.DATE_FORMAT);

        Log.create({
            telegramId: from.id,
            groupId: (chat.type === 'group' || chat.type === 'supergroup' ? chat.id : null),
            updateType: ctx.updateType,
            text,
            datetime,
            raw: JSON.stringify(ctx.update),
        }).then(function() {}).catch(function() {});

        return next()
    };


    return Log;
};
