require("dotenv").config();

const axios = require('axios')
const _ = require('lodash')

async function subscribe(address){
    const send_data = JSON.stringify({
        address,
    })

    // check if already subscribed

    const resp_get = await axios.get('https://webhook.xrpayments.co/api/v1/subscriptions', {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.XRPL_WEBHOOK_API_KEY,
            'x-api-secret': process.env.XRPL_WEBHOOK_API_SECRET
        }
    })

    const subscriptions = _.get(resp_get, 'data.subscriptions');
    const exist_subscription_id = _.filter(subscriptions, function(o) { return o.address === address; });;

    if(exist_subscription_id && exist_subscription_id.length > 0) return exist_subscription_id[0].id

    const resp = await axios.post('https://webhook.xrpayments.co/api/v1/subscriptions', send_data, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.XRPL_WEBHOOK_API_KEY,
            'x-api-secret': process.env.XRPL_WEBHOOK_API_SECRET
        }
    })


    let {data} = resp;

    if(data.success && data.success == true){
        return data.subscription_id
    }else{
        return false
    }
}

async function unsubscribe(subscribe_id){
    const resp =  await axios.delete(`https://webhook.xrpayments.co/api/v1/subscriptions/${subscribe_id}`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.XRPL_WEBHOOK_API_KEY,
            'x-api-secret': process.env.XRPL_WEBHOOK_API_SECRET
        }
    })

    const {status} = resp;

    if(status == 204){
        return true
    }else{
        return false
    }
}

module.exports = {
    subscribe,
    unsubscribe
};
