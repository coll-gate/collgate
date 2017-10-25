/**
 * @file eventmessage.js
 * @brief Event message collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-02
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let CountableCollection = require('../../main/collections/countable');
let EventMessageModel = require('../models/eventmessage');

let Collection = CountableCollection.extend({
    url: window.application.url(['main', 'event-message']),
    model: EventMessageModel,

    comparator: 'created_date',
});

module.exports = Collection;
