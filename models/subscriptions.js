'use strict';
const feedSource = require('./feed_source');
module.exports = function(sequelize, DataTypes) {
    const Subscriptions = sequelize.define('Subscriptions', {
        source: {
            type: DataTypes.INTEGER(),
            allowNull: false,
        },
        active: {
            type: DataTypes.BOOLEAN(255),
            allowNull: false,
            default: true,
        },
        chatId: {
            type: DataTypes.INTEGER(),
            allowNull: false,
        },
    });

    Subscriptions.prototype.setSettings = function(chatId, active) {
        return Subscriptions.findOrCreate({
            where: {
                chatId,
            },
            defaults: {
                active,
                source: 1,
            },
        }).spread((subscription, created) => {
            if (!created) {
                if (subscription.active === active) return false;
                subscription.active = active;
                subscription.save();
                return true;
            } else {
                if (!active) {
                    return false;
                }
                return true;
            }
        });
    };

    Subscriptions.prototype.getSettings = function(chatId, source) {
        return Subscriptions.findOne({
            where: { chatId: chatId, source: source },
        }).then(u => (u ? u.get({ plain: true }) : { active: false }));
    };

    Subscriptions.associate = function(models) {
        Subscriptions.belongsTo(models.FeedSource, {
            targetKey: 'id',
            foreignKey: 'source',
        });
    };

    return Subscriptions;
};
