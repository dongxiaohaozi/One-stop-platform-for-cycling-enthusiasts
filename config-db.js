(function() {
    const db_info = {url:'localhost',
                        username: 'webuser',
                        password: '<password>',
                        port: '<yourport>',
                        database: 'cs5003_P3',
                        collection: 'records',
                        mainCollection: 'users',
                        calendarCollection: 'calender'};

    const moduleExports = db_info;

    if (typeof __dirname != 'undefined')
        module.exports = moduleExports;
}());

