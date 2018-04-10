'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    return queryInterface.createTable('Withdraws', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        to_address: {
            type: Sequelize.STRING,
            allowNull: false
        },
        destination_tag: {
            type: Sequelize.BIGINT(255),
            allowNull: false
        },
        amount: {
            type: Sequelize.DECIMAL(20, 6),
            allowNull: false,
            defaultValue: 0.000000,
            validate: {min: 0.000000}
        },
        tx_hash: {
            type: Sequelize.STRING,
            allowNull: false
        },
        for_user: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            },
            onUpdate: 'cascade',
            onDelete: 'no action'
        },
        result: {
            type: Sequelize.STRING,
            allowNull: false
        },
        datetime: {
            allowNull: false,
            type: Sequelize.DATE
        },
        createdAt: {
            allowNull: false,
            type: Sequelize.DATE
        },
        updatedAt: {
            allowNull: false,
            type: Sequelize.DATE
        }
    })
  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    return queryInterface.dropTable('withdraws');
  }
};
