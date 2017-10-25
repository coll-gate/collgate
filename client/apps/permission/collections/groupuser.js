/**
 * @file groupuser.js
 * @brief Permission user collection from a group
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-09
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let PermissionGroupUserModel = require('../models/groupuser');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: function() {
        return window.application.url(['permission', 'group', this.group_id, 'user']);
    },
    model: PermissionGroupUserModel,

    initialize: function(models, options) {
        options || (options = {});
        this.group_id = options.group_id;

        Collection.__super__.initialize.apply(this, arguments);
    }
});

module.exports = Collection;
