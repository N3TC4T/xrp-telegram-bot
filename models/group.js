'use strict';
module.exports = function(sequelize, DataTypes) {
    const Group = sequelize.define('Group', {
        groupId: DataTypes.BIGINT,
        title: DataTypes.STRING,
    });

    Group.associate = function (models) {
        // associations can be defined here
    };

    Group.prototype.updateGroup = function(ctx, next) {
        let from, chat = null;
        if (ctx.updateType === "callback_query") {
            from = ctx.update.callback_query.from;
            chat = ctx.update.callback_query.message.chat
        } else {
            from = ctx.update.message.from;
            chat = ctx.update.message.chat
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
