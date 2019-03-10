'use strict';
module.exports = function (sequelize, DataTypes) {
    const Feed =  sequelize.define('Feed', {
        title: {
            type: DataTypes.TEXT(),
            allowNull: false,
        },
        published:{
            type: DataTypes.DATE,
            allowNull: false
        },
        link: {
            type: DataTypes.TEXT(),
            allowNull: false,
        },
        author: {
            type: DataTypes.STRING(),
            allowNull: false,
        },
        source: {
            type: DataTypes.INTEGER(),
            allowNull: false
        }
    });



    Feed.prototype.createIfNotExist =  function (entry) {
        return Feed.findOrCreate({
            where:{
                link: entry.link
            },
            defaults: {
                title: entry.title,
                published: entry.pubDate,
                author: entry.creator,
                source: 1
            }
        })
    };

    Feed.associate = function (models) {
        // associations can be defined here
        Feed.belongsTo(models.FeedSource, {
            targetKey: "id",
            foreignKey: "source"
        });
    };

    return Feed
};
