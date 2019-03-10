'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('FeedSource', {
        url:{
            type: DataTypes.STRING(),
            allowNull: false
        },
        active: {
            type: DataTypes.BOOLEAN(),
            allowNull: false,
            default: true
        },
    });
};
