/**
 * @file group.js
 * @brief Permission group collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-30
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let CountableCollection = require('../../main/collections/countable');
let PermissionGroupModel = require('../models/group');

let Collection = CountableCollection.extend({
    url: function() {
        return window.application.url(['permission', 'group']);
    },
    model: PermissionGroupModel
});

module.exports = Collection;
