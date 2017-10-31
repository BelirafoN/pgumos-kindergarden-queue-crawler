'use strict';

const puppeteer = require('puppeteer');
const EventEmitter = require('events');

const config = require('./config.json');

class PguMosCrawler extends EventEmitter{
    constructor(login, password, options) {
        super();

        this.login = login;
        this.password = password;
        this.options = options;

        this._browser = null;
        this._page = null;
    }

    getKindergartenInfo() {
        return (async () => {
            await this._startBrowser();

            try {
                await this._createPage();

                await this._authOnSite();
                await this._navigateOnSite();
                await this._findStatementInfo();
                await this._createPageScreenshot();

                return await this._getStatementQueueInfo();
            } finally {
                await this._browserHalt();
            }
        })();
    }

    _getStatementQueueInfo() {
        if (!this._page) {
            return Promise.reject('browser\'s page instance not inited');
        }

        return this._page.evaluate(() => {
            return document.querySelector('#D_dou_info').innerText;
        })
    }

    _findStatementInfo() {
        if (!this._page) {
            return Promise.reject('browser\'s page instance not inited');
        }

        return (async () => {
            this.emit('task', `Заполнение поля с номером заявления: ${this.options.statementNumber}`);
            await this._page.$eval('[name="field[d.internal.RequestNumber]"]', (input, statementNumber) => {
                input.value = statementNumber;
            }, [this.options.statementNumber]);

            this.emit('task', `Заполнение поля с фамилией: ${this.options.childLastName}`);
            await this._page.$eval('[name="field[d.internal.lastname]"]', (input, childLastName) => {
                input.value = childLastName;
            }, [this.options.childLastName]);

            this.emit('task', `Поиск`);
            const searchBtn = await this._page.$('#button_next');
            searchBtn.click();

            await wait(7000);
        })();
    }

    _navigateOnSite() {
        if (!this._page) {
            return Promise.reject('browser\'s page instance not inited');
        }

        return (async () => {
            this.emit('task', `Переход на страницу услуги записи в детский сад`);
            await this._page.goto(config.serviceUrl, {waitUntil: 'load'});

            this.emit('task', `Переход в раздел информации о выбранных организациях`);
            const organizationBtn = await this._page.$('.button.green-small:nth-of-type(1)');
            organizationBtn.click();

            await this._page.waitForNavigation({waitUntil: 'load'});

            await this._page.evaluate(() => {
                document.querySelector('.form_4 .chosen-single').focus();
            });
            await wait(300);
            await this._page.press('ArrowDown');
            await wait(300);
            await this._page.press('ArrowDown');
            await wait(300);
            await this._page.press('Enter');
            await wait(300);
        })();
    }

    _authOnSite() {
        if (!this._page) {
            return Promise.reject('browser\'s page instance not inited');
        }

        return (async () => {
            this.emit('task', `Переход на страницу портала госуслуг города Москвы: ${config.portalUrl}`);
            await this._page.goto(config.portalUrl, {waitUntil: 'load'});

            this.emit('task', `Поиск ссылки на страницу авторизации`);
            const href = await this._page.$eval('a[href*="oauth2"]', e => e.getAttribute('href'));
            this.emit('task', `Переход на страницу авторизации: ${href}`);
            await this._page.goto(href, {waitUntil: 'load'});

            this.emit('task', `Заполнение формы авторизации`);
            await this._page.$eval('[name="j_username"]', (el, login) => el.value = login, [this.login]);
            await this._page.$eval('[name="j_password"]', (el, password) => el.value = password, [this.password]);

            this.emit('task', `Авторизация`);
            const submitButton = await this._page.$('#outerlogin_button');
            submitButton.click();

            await this._page.waitForNavigation({waitUntil: 'load'});
        })();
    }

    _startBrowser() {
        this.emit('task', `Запуск браузера`);
        return puppeteer.launch({
            headless: this.options.headless
        }).then(browser => this._browser = browser);
    }

    _createPage() {
        if (this._browser) {
            return this._browser.newPage().then(page => this._page = page);
        }

        return Promise.reject('browser instance not inited for page creation');
    }

    _createPageScreenshot() {
        if (!this.options.hasOwnProperty('screenshot')) {
            return;
        }

        if (this._page) {
            this.emit('task', `Создание контрольного скриншета страницы: ${this.options.screenshot}`);

            return this._page.screenshot({path: this.options.screenshot});
        }

        return Promise.reject('browser\'s page instance not inited');
    }

    _browserHalt() {
        if (this._browser) {
            this.emit('task', `Закрытие браузера`);

            return (async () => {
                await this._browser.close();
                this._browser = null;
                this._page = null;
            })();
        }

        return Promise.reject('browser instance not inited for halt');
    }
}

function wait(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
}

module.exports = PguMosCrawler;
