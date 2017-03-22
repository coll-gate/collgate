/**
 * @file config.js
 * @brief Config collection
 * @author Frederic SCHERMA
 * @date 2017-03-22
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var ConfigModel = require('../models/config');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'main/config/',
    model: ConfigModel
});

module.exports = Collection;
