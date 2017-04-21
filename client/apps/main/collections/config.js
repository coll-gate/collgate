/**
 * @file config.js
 * @brief Config collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-22
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var ConfigModel = require('../models/config');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'main/config/',
    model: ConfigModel
});

module.exports = Collection;

