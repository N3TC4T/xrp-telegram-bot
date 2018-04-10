"use strict";

const util = require('util');
const defaultTimeout = 10000;
const promisify = util.promisify || function(x) { return x; };

function acquireLock(client, lockName, timeout, retryDelay, onLockAcquired) {
    function retry() {
        setTimeout(function() {
            acquireLock(client, lockName, timeout, retryDelay, onLockAcquired);
        }, retryDelay);
    }

    const lockTimeoutValue = (Date.now() + timeout + 1);
    client.set(lockName, lockTimeoutValue, 'PX', timeout, 'NX', function(err, result) {
        if(err || result === null) return retry();
        onLockAcquired(lockTimeoutValue);
    });
}

module.exports = function(client, lockName, retryDelay) {
    if(!(client && client.setnx)) {
        throw new Error("You must specify a client instance of http://github.com/mranney/node_redis");
    }

    retryDelay = retryDelay || 50;


    if(!lockName) {
        throw new Error("You must specify a lock string. It is on the redis key `lock.[string]` that the lock is acquired.");
    }

    lockName = "lock." + lockName;

    function lock(lockName, timeout, taskToPerform) {

        if(!taskToPerform) {
            taskToPerform = timeout;
            timeout = defaultTimeout;
        }

        acquireLock(client, lockName, timeout, retryDelay, function(lockTimeoutValue) {
            taskToPerform(promisify(function(done) {
                done = done || function() {};

                if(lockTimeoutValue > Date.now()) {
                    client.del(lockName, done);
                } else {
                    done();
                }
            }));
        });
    }

    if(util.promisify) {
        lock[util.promisify.custom] = function(timeout) {
            return new Promise(function(resolve) {
                lock(lockName, timeout || defaultTimeout, resolve);
            });
        }
    }

    return lock;
};
