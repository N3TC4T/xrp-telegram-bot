const schedule = require('node-schedule');
const axios = require('axios');

const BASE_API = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=XRP';
const PAIRS = ['EUR', 'USD'];

class MarketListener {
    constructor(bot, db) {
        this.bot = bot;
        this.db = db;
        this.start();
        this.fetchPrice();
    }

    start() {
        const self = this;
        schedule.scheduleJob('*/5 * * * *', function() {
            self.fetchPrice();
        });
    }

    fetchPrice() {
        try {
            PAIRS.forEach(p => {
                axios
                    .get(`${BASE_API}&convert=${p}`, {
                        timeout: 10000,
                        headers: {
                            'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
                        },
                    })
                    .then(response => {
                        const { data } = response;
                        const quote = data.data.XRP.quote;

                        this.db.Market.findOrCreate({
                            where: {
                                pair: p,
                                source: 'coinmarketcap',
                            },
                            defaults: {
                                ticker: quote[p],
                            },
                        }).spread((m, created) => {
                            if (!created) {
                                m.ticker = quote[p];
                                m.save();
                            }
                        });
                    })
                    .catch(e => {
                        console.log(`CANT FETCH PRICE  ${e}`);
                    });
            });
        } catch (e) {
            console.log(`CANNOT FETCH MARKET`);
        }
    }
}

module.exports = MarketListener;
