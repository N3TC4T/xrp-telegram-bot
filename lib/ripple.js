const RippledWsClient = require('rippled-ws-client');
const RippledWsClientSign = require('rippled-ws-client-sign');
const BigNumber = require('bignumber.js');

// Constants
require('dotenv').config();
const _DEV_ = process.env.NODE_ENV === 'development';

function xrpToDrops(xrp) {
    if (typeof xrp === 'string') {
        if (!xrp.match(/^-?[0-9]*\.?[0-9]*$/)) {
            console.log(`xrpToDrops: invalid value '${xrp}',` + ` should be a number matching (^-?[0-9]*\.?[0-9]*$).`);
            return false;
        } else if (xrp === '.') {
            console.log(`xrpToDrops: invalid value '${xrp}',` + ` should be a BigNumber or string-encoded number.`);
            return false;
        }
    }

    // Important: specify base 10 to avoid exponential notation, e.g. '1e-7'.
    xrp = new BigNumber(xrp).toString(10);

    // This should never happen; the value has already been
    // validated above. This just ensures BigNumber did not do
    // something unexpected.
    if (!xrp.match(/^-?[0-9.]+$/)) {
        console.log(`xrpToDrops: failed sanity check -` + ` value '${xrp}',` + ` does not match (^-?[0-9.]+$).`);
        return false;
    }

    const components = xrp.split('.');
    if (components.length > 2) {
        console.log(`xrpToDrops: failed sanity check -` + ` value '${xrp}' has` + ` too many decimal points.`);
        return false;
    }

    const fraction = components[1] || '0';
    if (fraction.length > 6) {
        console.log(`xrpToDrops: value '${xrp}' has` + ` too many decimal places.`);
        return false;
    }

    return new BigNumber(xrp)
        .times(1000000.0)
        .floor()
        .toString(10);
}

async function payment(data) {
    const wsURL = _DEV_ ? 'wss://s.altnet.rippletest.net:51233' : 'wss://s1.ripple.com:443';
    const Seed = process.env.WALLET_SECRET;

    const amount = xrpToDrops(data.amount);

    if (!amount) {
        return {
            resultCode: 'error',
            error: 'Invalid Amount',
        };
    }
    const Transaction = {
        TransactionType: 'Payment',
        Account: process.env.WALLET_ADDRESS,
        Destination: data.address,
        SourceTag: parseInt(data.source_tag),
        Amount: xrpToDrops(data.amount),
        LastLedgerSequence: null,
    };

    if (parseInt(data.destination_tag) !== 0) {
        Transaction.DestinationTag = parseInt(data.destination_tag);
    }

    return new RippledWsClient(wsURL)
        .then(Connection => {
            return new RippledWsClientSign(Transaction, Seed, Connection)
                .then(TransactionSuccess => {
                    Connection.close();
                    return TransactionSuccess;
                })
                .catch(SignError => {
                    return {
                        resultCode: 'error',
                        error: SignError.details,
                    };
                });
        })
        .catch(ConnectionError => {
            return {
                resultCode: 'error',
                error: ConnectionError,
            };
        });
}

module.exports = {
    payment,
};
