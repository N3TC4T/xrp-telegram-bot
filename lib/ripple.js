
const RippledWsClient = require('rippled-ws-client')
const RippledWsClientSign = require('rippled-ws-client-sign')

// Constants
require("dotenv").config();
const _DEV_ = process.env.NODE_ENV === 'development';

async function payment(data) {

    const wsURL = _DEV_ ? 'wss://s.altnet.rippletest.net:51233' : 'wss://s1.ripple.com:443'
    const Seed =  process.env.WALLET_SECRET

    const Transaction = {
        TransactionType: 'Payment',
        Account: process.env.WALLET_ADDRESS,
        Destination:  data.address,
        SourceTag: parseInt(data.source_tag),
        Amount: data.amount * 1000000,
        LastLedgerSequence: null
      }

      if(parseInt(data.destination_tag) !== 0){
        Transaction.DestinationTag = parseInt(data.destination_tag)
      }
      
      return new RippledWsClient(wsURL).then((Connection) => {
        return new RippledWsClientSign(Transaction, Seed, Connection).then((TransactionSuccess) => {
          Connection.close()
          return TransactionSuccess
        }).catch((SignError) => {
          return {
            resultCode: 'error',
            error: SignError.details
            }
        })
      }).catch((ConnectionError) => {
        return {
            resultCode: 'error',
            error: ConnectionError
        }
      })
}

module.exports = {
    payment
};
