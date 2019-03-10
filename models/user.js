'use strict';

//utils
const _ = require("lodash");
const logger = require('../lib/loggin');

module.exports = function(sequelize, DataTypes) {
    const User = sequelize.define('User', {
        telegramId: {
            type: DataTypes.BIGINT(255),
            allowNull: true,
            unique: true
        },
        first_name: DataTypes.STRING,
        last_name: DataTypes.STRING,
        username: {
            type : DataTypes.STRING,

        },
        language: DataTypes.STRING,
        balance: {
            type: DataTypes.DECIMAL(20, 6),
            allowNull: false,
            defaultValue: 0.000000,
            validate: {min: 0.000000}
        }
    });

    User.associate = function (models) {
        // associations can be defined here
    };

    User.prototype.updateUser = function (ctx, next) {
        let from = null;
        if (ctx.updateType === "callback_query") {
            from = ctx.update.callback_query.from;
        } else {
            if(_.has(ctx, ['update', 'message', 'from'])){
                from = ctx.update.message.from;
            }
        }

        if(!from){
            return next()
        }

        User.findOne({where: {telegramId: from.id}})
            .then(async (u) => {
                if (u) {
                    if(!u.username && from.username){
                        await User.findOne({where: { $col: sequelize.where(sequelize.fn('lower', sequelize.col('username')), sequelize.fn('lower', from.username)) }})
                        .then(async (user) => {
                            if(!user.telegramId){
                                await sequelize.query(`UPDATE Transactions SET to_user = ${u.id} WHERE to_user = ${user.id}`)

                                await u.increment('balance', {by: user.get('balance')})
                                User.destroy({
                                    where: {
                                        id: user.id
                                    }
                                })

                                logger.info(`Migrate  ${user.username} -> ${user.id} - +${user.balance}`);
                            }
                        })
                    }
                    u.first_name = from.first_name;
                    u.last_name = from.last_name;
                    u.username = from.username;
                    u.language = from.language_code;
                    u.save();
                } else {
                    User.findOne({where: { $col: sequelize.where(sequelize.fn('lower', sequelize.col('username')), sequelize.fn('lower', from.username)) }})
                        .then((u) => {
                            if (u) {
                                u.first_name = from.first_name;
                                u.last_name = from.last_name;
                                u.telegramId = from.id;
                                u.language = from.language_code;
                                u.save();
                            } else {
                                User.create({
                                    telegramId: from.id,
                                    first_name: from.first_name,
                                    last_name: from.last_name,
                                    username: from.username,
                                    language: from.language_code
                                })
                            }
                        })
                }
            });

        return next()
    };

    User.prototype.getUser = function (ctx) {
        let from = null;
        if (ctx.updateType === "callback_query") {
            from = ctx.update.callback_query.from;
        } else {
            from = ctx.update.message.from;
        }
        return User.findOne({where: {telegramId: from.id}})
            .then((u) => u ? u.get({plain: true}) : {});
    };


    User.prototype.getUserByID= function (userID) {
        return User.findOrCreate({where: {telegramId: userID}, defaults: {telegramId: userID}})
            .spread((user) => {
                return user.get({
                    plain: true
                })
            })
    };

    User.prototype.getUserByUsername = function (username) {
        return User.findOrCreate({where: { $col: sequelize.where(sequelize.fn('lower', sequelize.col('username')), sequelize.fn('lower', username)) }, defaults: {username: username}})
            .spread((user) => {
                return user.get({
                    plain: true
                })
            })
    };

    User.prototype.increaseBalance =  function (user, amount) {
        return User.findOne({where: {id: user.id}})
            .then((user) => {
                return user.increment('balance', {by: amount})
                    .then(async(user) => {
                        const before = user.get('balance');
                        const after = await user.reload().get('balance');
                        logger.info(`Increase Balance - ${before} -> ${after} - ${user.username}:${user.id}`);
                        return after
                    })
            });
    };

    User.prototype.decreaseBalance = function (user, amount) {
        return User.findOne({where: {id: user.id}})
            .then((user) => {
                return user.decrement('balance', {by: amount})
                    .then(async(user) => {
                        const before = user.get('balance');
                        const after = await user.reload().get('balance');
                        logger.info(`Decrease Balance - ${before} -> ${after} - ${user.username}:${user.id}`);
                        return after
                    })
            });

    };

    return User
};
