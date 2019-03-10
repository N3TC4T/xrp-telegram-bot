require("dotenv").config();


class MarketHandler {
    constructor(app, db) {
        this.app = app;
        this.db = db;
    }

    CurrencyFormatted(amount)
    {
        var a = new Number(amount);
        var b = a.toFixed(2); //get 12345678.90
        a = parseInt(a); // get 12345678
        b = (b-a).toPrecision(2); //get 0.90
        b = parseFloat(b).toFixed(2); //in case we get 0.0, we pad it out to 0.00
        a = a.toLocaleString();//put in commas - IE also puts in .00, so we'll get 12,345,678.00
        //if IE (our number ends in .00)
        if(a < 1 && a.lastIndexOf('.00') == (a.length - 3))
        {
            a=a.substr(0, a.length-3); //delete the .00
        }
        return a+b.substr(1);//remove the 0 from b, then return a + b = 12,345,678.90
    }

    async getResponse(){
        let rows = []
        const self = this
        return await this.db.Market.findAll().then((markets) => {
            markets.forEach(m => {
                let ticker = JSON.parse(m.ticker)
                let symbole = m.pair === 'USD' ? '$' : '€'
                rows.push(`XRP Market ${m.pair}\n`)
                rows.push(`----------------------------\n`)
                rows.push(`Price: ***${Math.round(ticker.price * 100) / 100} ${symbole}***\n`)
                if(ticker.percent_change_24h > 0){
                    rows.push(`24H: ***${Math.round(ticker.percent_change_24h * 100) / 100} %***\n`)
                }else{
                    rows.push(`24H: ***🔻 ${Math.round(ticker.percent_change_24h * 100) / 100} %***\n`)
                }
                if(ticker.percent_change_7d > 0){
                    rows.push(`7D: ***${Math.round(ticker.percent_change_7d * 100) / 100} %***\n`)
                }else{
                    rows.push(`7D: ***🔻 ${Math.round(ticker.percent_change_7d * 100) / 100} %***\n`)
                }
                rows.push(`Volume 24H: ***${self.CurrencyFormatted(Math.round(ticker.volume_24h * 1000) / 1000)} ${symbole}***\n`)
                rows.push(`Market Cap: ***${self.CurrencyFormatted(Math.round(ticker.market_cap * 1000) / 1000) } ${symbole}***\n`)

                rows.push(`\n`)    
            });
            return rows.join('')
        })
    }
    setHandler() {
        this.app.hears('📈 Market', async(ctx) => {
            const {replyWithMarkdown} = ctx;
            return replyWithMarkdown(await this.getResponse())
        })

        this.app.command('market', async (ctx) => {
            const {replyWithMarkdown} = ctx;
            return replyWithMarkdown(await this.getResponse())
        })
    }
}

module.exports = MarketHandler;
