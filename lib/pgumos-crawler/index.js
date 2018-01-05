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
            return [...document.querySelectorAll('.selected_dou_step2 > div.js-sel-dou')]
                .map(elem => {
                    return [
                        elem.querySelector('label').innerText,
                        elem.querySelector('div').innerText,
                    ].join('\n');
                })
                .join('\n');
        })
    }

    _findStatementInfo() {
        if (!this._page) {
            return Promise.reject('browser\'s page instance not inited');
        }

        return (async () => {
            const childGenderToNumber = Number(this.options.childGender);
            const isMan = childGenderToNumber === 1;

            const setInputValue = (input, newValue) => input.value = newValue;

            this._emit('task', 'Заполнение поля с именем', this.options.childFirstName);
            await this._page.$eval('#declarant-firstname', setInputValue, [this.options.childFirstName]);

            this._emit('task', 'Заполнение поля с отчеством', this.options.childMiddleName);
            await this._page.$eval('#declarant-middlename', setInputValue, [this.options.childMiddleName]);

            this._emit('task', 'Заполнение поля с фамилией', this.options.childLastName);
            await this._page.$eval('#declarant-lastname', setInputValue, [this.options.childLastName]);

            this._emit('task', 'Выбор пола ребенка', (isMan ? 'Мужской' : 'Женский'));

            const genderCheckboxLabel = await this._page.$(`[for="declarant-gender-${isMan ? 1 : 2}"]`);
            genderCheckboxLabel.click();

            this._emit('task', 'Заполнение поля с датой рождения', this.options.childBirthDate);
            await this._page.$eval('#declarant-birthdate', setInputValue, [this.options.childBirthDate]);

            this._emit('task', 'Заполнение поля с серией свидетельства о рождении', this.options.childDocSer);
            await this._page.$eval('[name="field[file.0.new_serie]"]', setInputValue, [this.options.childDocSer]);

            this._emit('task', 'Заполнение поля с номером свидетельства о рождении', this.options.childDocNumber);
            await this._page.$eval('[name="field[file.0.new_name]"]', setInputValue, [this.options.childDocNumber]);

            this._emit('task', 'Заполнение поля с датой свидетельства о рождении', this.options.childDocDate);
            await this._page.$eval('[name="field[file.0.new_docdate]"]', setInputValue, [this.options.childDocDate]);

            this._emit('task', 'Заполнение поля с местом выдачи свидетельства о рождении', this.options.childDocPlace);
            await this._page.$eval('[name="field[file.0.new_whosign]"]', setInputValue, [this.options.childDocPlace]);

            await this._page.evaluate(() => {
                document.querySelector('.js-place-of-issue .chosen-single').focus();
            });
            await wait(300);
            await this._page.press('ArrowDown');
            await wait(300);
            await this._page.press('ArrowDown');
            await wait(300);
            await this._page.press('Enter');
            await wait(300);

            this._emit('task', 'Поиск');

            const searchBtn = await this._page.$('#find_child_info');
            searchBtn.click();

            await wait(7000);
        })();
    }

    /**
     * @param {string} eventName
     * @param {string} eventDescription
     * @param {string|number} data
     * @private
     */
    _emit(eventName, eventDescription, data = null) {
        if (this.options.verbose && data !== null) {
            this.emit(eventName, `${eventDescription}: ${data}`);
        } else {
            this.emit(eventName, eventDescription);
        }
    }

    _navigateOnSite() {
        if (!this._page) {
            return Promise.reject('browser\'s page instance not inited');
        }

        return (async () => {
            this._emit('task', 'Переход на страницу услуги записи в детский сад');
            await this._page.goto(config.serviceUrl, {waitUntil: 'load'});

            this._emit('task', `Переход в раздел информации о выбранных организациях`);
            const organizationBtn = await this._page.$('.button.green-small:nth-of-type(1)');
            organizationBtn.click();

            await this._page.waitForNavigation({waitUntil: 'load'});
        })();
    }

    _authOnSite() {
        if (!this._page) {
            return Promise.reject('browser\'s page instance not inited');
        }

        return (async () => {
            this._emit('task', 'Переход на страницу портала госуслуг города Москвы', config.portalUrl);
            await this._page.goto(config.portalUrl, {waitUntil: 'load'});

            this._emit('task', 'Поиск ссылки на страницу авторизации');
            const href = await this._page.$eval('a[href*="oauth2"]', e => e.getAttribute('href'));
            this._emit('task', 'Переход на страницу авторизации', href);
            await this._page.goto(href, {waitUntil: 'load'});

            this._emit('task', 'Заполнение формы авторизации');
            await this._page.$eval('[name="j_username"]', (el, login) => el.value = login, [this.login]);
            await this._page.$eval('[name="j_password"]', (el, password) => el.value = password, [this.password]);

            this._emit('task', 'Авторизация', this.login);
            const submitButton = await this._page.$('#outerlogin_button');
            submitButton.click();

            await this._page.waitForNavigation({waitUntil: 'load'});
        })();
    }

    _startBrowser() {
        this._emit('task', 'Запуск браузера');

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
            //INFO: тут так и задумано, чтобы путь к файлу было видно и не под verbose
            this._emit('task', `Создание контрольного скриншета страницы: ${this.options.screenshot}`);

            return this._page.screenshot({path: this.options.screenshot});
        }

        return Promise.reject('browser\'s page instance not inited');
    }

    _browserHalt() {
        if (this._browser) {
            this._emit('task', 'Закрытие браузера');

            return (async () => {
                await this._browser.close();

                this._browser = null;
                this._page = null;
            })();
        }

        return Promise.reject('browser instance not inited for halt');
    }
}

/**
 * @param {number} delay
 * @returns {Promise<any>}
 */
function wait(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
}

module.exports = PguMosCrawler;
