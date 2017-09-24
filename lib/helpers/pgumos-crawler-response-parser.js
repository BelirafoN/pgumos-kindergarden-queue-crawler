'use strict';

const QUEUE_POSITION_REGEXP = /:\s(\d+)/;
const QUEUE_DESCRIPTION_REGEXP = /\((.+)\)/;

/**
 * @param {string} message
 * @returns {Promise}
 */
module.exports = function parse(message) {
    if (!message) {
        return Promise.reject('message is empty');
    }

    const messageRows = message.split('\n');
    const organizations = {};

    organizations[messageRows[1]] = {
        orgName: messageRows[1],
        position: getQueuePosition(messageRows[2]),
        description: getQueueDescription(messageRows[2]),
        priority: true,
    };

    organizations[messageRows[4]] = {
        orgName: messageRows[4],
        position: getQueuePosition(messageRows[5]),
        description: getQueueDescription(messageRows[5]),
        priority: false,
    };

    organizations[messageRows[7]] = {
        orgName: messageRows[7],
        position: getQueuePosition(messageRows[8]),
        description: getQueueDescription(messageRows[8]),
        priority: false,
    };

    return Promise.resolve({
        organizations,
        time: Date.now(),
    });
};

/**
 * @param {string} str
 * @returns {string|null}
 */
function getQueuePosition(str) {
    const result = str.match(QUEUE_POSITION_REGEXP);

    return result.length === 2 ? result[1] : null;
}

/**
 * @param {string} str
 * @returns {string|null}
 */
function getQueueDescription(str) {
    const result = str.match(QUEUE_DESCRIPTION_REGEXP);

    return result.length === 2 ? result[1] : null;
}
