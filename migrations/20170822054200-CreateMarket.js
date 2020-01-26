'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
        return queryInterface.createTable('Market', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            pair: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            ticker: {
                type: Sequelize.JSON,
                allowNull: false,
            },
            source: {
                type: Sequelize.STRING,
                allowNull: false,
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
        return queryInterface.dropTable('Market');
    },
};
