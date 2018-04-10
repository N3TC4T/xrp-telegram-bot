const redis = require('redis');
const { promisify } = require('util');

class RedisSession {
    constructor (options) {
        this.options = Object.assign({
            property: 'session',
            getSessionKey: (ctx) => ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`,
            store: {}
        }, options);

        this.client = redis.createClient(this.options.store)
    }

    getSession (key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, json) => {
                if (err) {
                    return reject(err)
                }
                if (json) {
                    try {
                        const session = JSON.parse(json);
                        resolve(session)
                    } catch (error) {
                        console.log('Parse session state failed', error)
                    }
                }
                resolve({})
            })
        })
    }

    clearSession (key) {
        return new Promise((resolve, reject) => {
            this.client.del(key, (err, json) => {
                if (err) {
                    return reject(err)
                }
                resolve()
            })
        })
    }

    saveSession (key, session) {
        if (!session || Object.keys(session).length === 0) {
            return this.clearSession(key)
        }
        return new Promise((resolve, reject) => {
            this.client.set(key, JSON.stringify(session), (err, json) => {
                if (err) {
                    return reject(err)
                }
                if (this.options.ttl) {
                    this.client.expire(key, this.options.ttl)
                }
                resolve({})
            })
        })
    }

    middleware () {
        return (ctx, next) => {
            const key = this.options.getSessionKey(ctx);
            if (!key) {
                return next()
            }
            return this.getSession(key).then((session) => {
                Object.defineProperty(session, 'lock', {
                    value:  promisify(require("./lock")(this.client , key)),
                    writable: false
                });
                Object.defineProperty(ctx, this.options.property, {
                    get: function () { return session },
                    set: function (newValue) { session = Object.assign({}, newValue) },
                });
                return next().then(() => this.saveSession(key, session))
            })
        }
    }
}

module.exports = RedisSession;
