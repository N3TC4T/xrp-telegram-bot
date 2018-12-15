require("dotenv").config();

const RippleAPI = require('ripple-lib').RippleAPI;



async function payment(data) {

    const rippleAPI = new RippleAPI({ server: "wss://s3.ripple.com:443" });

    const instructions = {
        maxFee: '0.15',
        maxLedgerVersionOffset: 50,
    };

    const payment = {
        source: {
            address: process.env.WALLET_ADDRESS,
            tag: parseInt(data.source_tag),
            maxAmount: {
                value: data.amount,
                currency: 'XRP',
            },
        },
        destination: {
            address: data.address,
            tag: parseInt(data.destination_tag),
            amount: {
                value: data.amount,
                currency: 'XRP',
            },
        },
    };

    return rippleAPI.connect().then(() => {
        return rippleAPI.preparePayment(payment.source.address, payment, instructions).then(
            preparedTransaction => {
                const { signedTransaction, id } = rippleAPI.sign(preparedTransaction.txJSON,  process.env.WALLET_SECRET)
                return rippleAPI.submit(signedTransaction).then((result) => {
                    return Object.assign({id} , result)
                }, (error) => {
                    return {
                        resultCode: 'error',
                        error
                    }
                })
            }
        )
    });


}

module.exports = {
    payment
};
