/**
 * @file user.js
 * @brief Permission user collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-30
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let CountableCollection = require('../../main/collections/countable');
let PermissionUserModel = require('../models/user');

let Collection = CountableCollection.extend({
    url: function() {
        if (this.is_group) {
            return window.application.url(['permission', 'group', this.name, 'user']);
        } else {
            return window.application.url(['permission', 'user']);
        }
    },

    model: PermissionUserModel,

    initialize: function(models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        this.is_group = options.is_group || false;

        if (options.name) {
            this.name = options.name;
        }
    }
});

module.exports = Collection;
