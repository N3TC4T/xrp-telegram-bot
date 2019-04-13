'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
        return queryInterface.createTable('Logs', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            telegramId: {
                type: Sequelize.BIGINT(255),
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'telegramId',
                },
                onUpdate: 'cascade',
                onDelete: 'no action',
            },
            groupId: {
                type: Sequelize.BIGINT(255),
                allowNull: true,
                references: {
                    model: 'Groups',
                    key: 'groupId',
                },
                onUpdate: 'cascade',
                onDelete: 'no action',
            },
            text: {
                type: Sequelize.TEXT,
            },
            updateType: {
                type: Sequelize.STRING(64),
            },
            raw: {
                type: Sequelize.TEXT,
            },
            datetime: {
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
        return queryInterface.dropTable('logs');
    },
};
