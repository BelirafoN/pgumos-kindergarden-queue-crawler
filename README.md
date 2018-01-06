# PGU.MOS.RU Crawler
------------
Краулер статуса очереди в детский сад на портале pgu.mos.ru

## Установка 

```bash
$ npm i pgumos-kindergarden-queue-crawler
```

### Использование

```bash
kgcrawler --help
```

### Конфигурация

Конфигурация производится с помощью следующих переменных окружения:

* `KLB_PGU_MOS_LOGIN` - логин учетной записи на портале pgu.mos.ru
* `KLB_PGU_MOS_SECRET` - пароль учетной записи на портале pgu.mos.ru
* `KLB_CHILD_FIRSTNAME` - имя ребенка
* `KLB_CHILD_SECONDNAME` - отчество ребенка
* `KLB_CHILD_LASTNAME` - фамилия ребенка
* `KLB_CHILD_GENDER` - пол ребенка
* `KLB_CHILD_BIRTHDATE` - дата рождения ребенка (ДД.ММ.ГГГГ)
* `KLB_CHILD_DOC_SER` - серия свидетельства о рождении
* `KLB_CHILD_DOC_NUMBER` - номер свидетельства о рождении
* `KLB_CHILD_DOC_DATE` - дата выдачи свидетельства о рождении (ДД.ММ.ГГГГ)
* `KLB_CHILD_DOC_PLACE` - кем выдано свидетельства о рождении

## Лицензия 

Licensed under the MIT License
