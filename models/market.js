'use strict';
module.exports = function (sequelize, DataTypes) {
    const Market =  sequelize.define('Market', {
        pair: {
            type: DataTypes.STRING(),
            allowNull: false,
        },
        ticker:{
            type: DataTypes.JSON(),
            allowNull: false
        },
        source: {
            type: DataTypes.STRING(),
            allowNull: false,
        }
    });

    Market.prototype.calculate =  function (amount, pair) {
        return Market.findOne({
            where:{
                pair
            }
        }).then((m) => {
            const ticker = JSON.parse(m.ticker)
            return Math.round((amount * ticker.price) * 100) / 100
        });
    };

    return Market
};
