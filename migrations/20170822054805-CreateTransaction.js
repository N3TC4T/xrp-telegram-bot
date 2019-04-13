'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
        return queryInterface.createTable('Transactions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            type: {
                type: Sequelize.ENUM,
                values: ['direct', 'tip'],
            },
            amount: {
                type: Sequelize.DECIMAL(20, 6),
                allowNull: false,
                defaultValue: 0.0,
                validate: { min: 0.0 },
            },
            sender_username: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            recipient_username: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            from_user: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onUpdate: 'cascade',
                onDelete: 'no action',
            },
            to_user: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onUpdate: 'cascade',
                onDelete: 'no action',
            },
            datetime: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },

    down: function(queryInterface, Sequelize) {
        /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
        return queryInterface.dropTable('transactions');
    },
};
