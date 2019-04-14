'use strict';

const _ = require('lodash');

module.exports = function(sequelize, DataTypes) {
    const UserGroup = sequelize.define('UserGroup', {
        user: {
            type: DataTypes.INTEGER(),
            allowNull: true,
        },
        group: {
            type: DataTypes.INTEGER(),
            allowNull: true,
        },
    });

    UserGroup.prototype.handle = async function(ctx, user) {
        let chat = null;
        let left_chat_member = null;
        let from = null;

        try {
            if (ctx.updateType === 'callback_query') {
                chat = ctx.update.callback_query.message.chat;
                from = ctx.update.callback_query.from;
            } else {
                if (_.has(ctx, ['update', 'message', 'chat'])) {
                    chat = ctx.update.message.chat;
                }
                if (_.has(ctx, ['update', 'message', 'left_chat_member'])) {
                    left_chat_member = ctx.update.message.left_chat_member;
                }
                if (_.has(ctx, ['update', 'message', 'from'])) {
                    from = ctx.update.message.from;
                }
            }

            if (!chat || !user) {
                return;
            }
            const group = await sequelize.models.Group.findOne({ where: { groupId: chat.id } });
            if (!group) {
                return;
            }

            if (!left_chat_member) {
                UserGroup.findOrCreate({
                    where: {
                        group: group.id,
                        user: user.id,
                    },
                });
            } else {
                if (!from) {
                    return;
                }
                if (left_chat_member.id !== from.id) {
                    // someone kicked the user
                    if (!from.is_bot) {
                        UserGroup.findOrCreate({
                            where: {
                                group: group.id,
                                user: user.id,
                            },
                        });
                    }

                    if (!left_chat_member.is_bot) {
                        const left_user = await sequelize.models.User.findOne({
                            where: { telegramId: left_chat_member.id },
                        });

                        if (left_user) {
                            UserGroup.destroy({
                                where: {
                                    group: group.id,
                                    user: left_user.id,
                                },
                            });
                        }
                    }
                } else {
                    // user left by itself
                    if (!left_chat_member.is_bot) {
                        UserGroup.destroy({
                            where: {
                                group: group.id,
                                user: user.id,
                            },
                        });
                    }
                }
            }
        } catch (e) {}
    };

    UserGroup.associate = function(models) {
        // associations can be defined here
        UserGroup.belongsTo(models.User, {
            foreignKey: 'user',
        });
        UserGroup.belongsTo(models.Group, {
            foreignKey: 'group',
        });
    };

    return UserGroup;
};
