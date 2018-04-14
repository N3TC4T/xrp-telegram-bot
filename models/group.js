'use strict';

const _ = require("lodash");

module.exports = function(sequelize, DataTypes) {
    const Group = sequelize.define('Group', {
        groupId: DataTypes.BIGINT,
        title: DataTypes.STRING,
    });

    Group.associate = function (models) {
        // associations can be defined here
    };

    Group.prototype.updateGroup = function(ctx, next) {
        let chat = null;
        if (ctx.updateType === "callback_query") {
            chat = ctx.update.callback_query.message.chat
        } else {
            if(_.has(ctx, ['update', 'message', 'chat'])){
                chat = ctx.update.message.chat
            }
        }
        if(!chat){
            return next()
        }

        if(!(chat.type === 'group' || chat.type === 'supergroup')) {
            return next()
        }
        Group.findOne({where: {groupId: chat.id}})
            .then((g) => {
                if(g) {
                    g.title = chat.title;
                    g.type = chat.type;
                    g.save();
                } else {
                    Group.create({
                        groupId: chat.id,
                        title: chat.title,
                        type: chat.type
                    })
                }
            });
        return next()
    };

    return Group;
};
