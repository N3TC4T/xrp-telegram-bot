require('dotenv').config();

const { Composer } = require('telegraf');

class DepositHandler {
    constructor(app, db) {
        this.app = app;
        this.db = db;
    }

    setHandler() {
        this.app.hears(
            '⬇️ Deposit',
            Composer.privateChat(async ctx => {
                const { replyWithPhoto, replyWithHTML } = ctx;

                const userModel = new this.db.User();
                const user = await userModel.getUser(ctx);
                const address = `https://ripple.com/send?to=${process.env.WALLET_ADDRESS}&dt=${user.telegramId}`;
                let qrCode = `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${address}`;
                replyWithPhoto(qrCode).then(() => {
                    replyWithHTML(
                        'Send XRP to the address & destination tag displayed below to add XRP to  your balance\n' +
                            '\n⚠️ Please do not forget to enter your <b>Destination Tag</b> when sending your XRP! ',
                    ).then(() =>
                        replyWithHTML(
                            `<b>Address: </b>\n<code>${
                                process.env.WALLET_ADDRESS
                            }</code>\n\n<b>Destination Tag: </b>\n<code>${user.telegramId}</code>`,
                        ),
                    );
                });
            }),
        );
    }
}

module.exports = DepositHandler;
