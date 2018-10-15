'use strict';
const moment = require("moment");
const v = require('./../config/vars');

const _ = require("lodash");

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
            if(_.has(ctx, ['update', 'message', 'from'])){
                from = ctx.update.message.from;
            }
        }
        if(!from){
            return next()
        }

        chat = update.message.chat;
        text = update.message.text && update.message.text;
        datetime = moment.unix(update.message.date).format(v.DATE_FORMAT);

        if(chat.type === 'group' || chat.type === 'supergroup'){
            if(chat.id === -1001384909816 || chat.id === -1001155359296){
                return next()
            }
        }

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
