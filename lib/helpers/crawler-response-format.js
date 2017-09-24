'use strict';

module.exports = crawlerResponse => Object.keys(crawlerResponse).reduce((acc, key) => {
    const {priority: isPriority, orgName, position} = crawlerResponse[key];

    return acc + `${isPriority ? '(осн.)' : '(зап.)'} ${orgName}: ${position}\n`;
}, '');