let Parser = require('rss-parser');
let parser = new Parser();
const schedule = require('node-schedule');

const FEED_URL = 'https://xrpcommunity.blog/rss/';

class FeedListener {
    constructor(bot, db) {
        this.bot = bot;
        this.db = db;
        this.start();
    }

    start() {
        const self = this;
        schedule.scheduleJob('*/5 * * * *', function() {
            self.fetchFeed();
        });
    }

    sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    sendFeed(feed) {
        this.db.Subscriptions.findAll({
            where: {
                active: true,
            },
        }).then(async subscriptions => {
            subscriptions.forEach(async s => {
                try {
                    this.bot.telegram
                        .sendMessage(s.chatId, `New #XRPCommunity Blog Post From ${feed.author}\n\n${feed.link}\n`)
                        .catch(() => console.log(`Broadcast Failed for chat id ${s.chatId}`));
                    await this.sleep(1000);
                } catch (e) {
                    // console.log(`Broadcast Feed Failed for chatId ${s.chatId}`)
                }
            });
        });
    }

    fetchFeed() {
        try {
            return parser.parseURL(FEED_URL).then(feed => {
                feed.items.forEach(entry => {
                    this.db.Feed.findOrCreate({
                        where: {
                            link: entry.link,
                        },
                        defaults: {
                            title: entry.title,
                            published: entry.pubDate,
                            author: entry.creator,
                            source: 1,
                        },
                    }).spread((feed, created) => {
                        if (created) {
                            this.sendFeed(feed);
                        }
                    });
                });
            });
        } catch (e) {
            console.log(`cannot fetch feed!`);
        }
    }
}

module.exports = FeedListener;
