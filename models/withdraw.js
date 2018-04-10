'use strict';
module.exports = function (sequelize, DataTypes) {
    const Withdraw =  sequelize.define('Withdraw', {
        to_address:{
            type: DataTypes.STRING(),
            allowNull: false
        },
        destination_tag: {
            type: DataTypes.BIGINT(255),
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(20, 6),
            allowNull: false,
        },
        tx_hash: {
            type: DataTypes.STRING(),
            allowNull: false
        },
        for_user: {
            type: DataTypes.INTEGER(),
            allowNull: false,
        },
        result:{
            type: DataTypes.STRING(),
            allowNull: false
        },
        datetime: {
            allowNull: false,
            type: DataTypes.DATE
        }
    });


    Withdraw.associate = function (models) {
        // associations can be defined here
        Withdraw.belongsTo(models.User, {
            targetKey: "id",
            foreignKey: "for_user"
        });
    };


    return Withdraw
};
