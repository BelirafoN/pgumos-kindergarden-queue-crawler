'use strict';

const chalk = require('chalk');

module.exports = crawlerResponse => Object.keys(crawlerResponse).reduce((acc, key) => {
    const {priority: isPriority, orgName, position} = crawlerResponse[key];

    return acc + `${chalk.gray(isPriority ? '(осн.)' : '(зап.)')} ${orgName}: ${chalk.yellow(chalk.bold(position))}\n`;
}, '');
