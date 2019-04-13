'use strict';

const xrpl_webhook = require('../lib/webhook');

module.exports = function(sequelize, DataTypes) {
    const WalletNotify = sequelize.define('WalletNotify', {
        address: {
            type: DataTypes.STRING(),
            allowNull: false,
        },
        active: {
            type: DataTypes.BOOLEAN(),
            allowNull: false,
            default: true,
        },
        subscription_id: {
            type: DataTypes.INTEGER(),
            allowNull: false,
            default: true,
        },
        for_user: {
            type: DataTypes.INTEGER(),
            allowNull: false,
        },
    });

    WalletNotify.prototype.activeNotify = function(for_user, address) {
        return WalletNotify.findOrCreate({
            where: {
                for_user,
                address,
            },
            defaults: {
                active: true,
                subscription_id: 0,
            },
        }).spread(async (notify, created) => {
            if (!created) {
                if (notify.active === true) return false;
            }
            const subscription_id = await xrpl_webhook.subscribe(address);
            if (subscription_id) {
                notify.active = true;
                notify.subscription_id = subscription_id;
                notify.save();
                return true;
            } else {
                return false;
            }
        });
    };

    WalletNotify.prototype.deactiveNotify = function(id) {
        WalletNotify.findOne({ where: { id } }).then(async notify => {
            if (notify) {
                notify.active = false;
                await notify.save();

                const exist_count = await WalletNotify.count({ where: { address: notify.address, active: true } });
                if (exist_count === 0) {
                    await xrpl_webhook.unsubscribe(notify.subscription_id);
                }
                return true;
            } else {
                return false;
            }
        });
    };

    WalletNotify.associate = function(models) {
        // associations can be defined here
        WalletNotify.belongsTo(models.User, {
            targetKey: 'id',
            foreignKey: 'for_user',
        });
    };

    return WalletNotify;
};
