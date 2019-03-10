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

    return Market
};
