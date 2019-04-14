'use strict';
module.exports = function(sequelize, DataTypes) {
    const Transaction = sequelize.define('Transaction', {
        amount: {
            type: DataTypes.DECIMAL(20, 6),
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM,
            values: ['direct', 'tip', 'airdrop'],
        },
        sender_username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        recipient_username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        from_user: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        to_user: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        datetime: {
            allowNull: false,
            type: DataTypes.DATE,
        },
    });

    Transaction.associate = function(models) {
        // associations can be defined here
        Transaction.belongsTo(models.User, {
            targetKey: 'id',
            foreignKey: 'from_user',
        });
        Transaction.belongsTo(models.User, {
            targetKey: 'id',
            foreignKey: 'to_user',
        });
    };

    return Transaction;
};
