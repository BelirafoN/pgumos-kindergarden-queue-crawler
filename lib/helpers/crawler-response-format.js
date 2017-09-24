'use strict';

module.exports = crawlerResponse => Object.keys(crawlerResponse).reduce((acc, orgName) => {
    const orgData = crawlerResponse[orgName];

    return acc + `${orgData.priority ? '(осн.)' : '(зап.)'} ${orgData.orgName}: ${orgData.position}\n`;
}, '');