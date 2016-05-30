/**
 * @file user.js
 * @brief Permission user collection
 * @author Frederic SCHERMA
 * @date 2016-05-30
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var PermissionUserModel = require('../models/user');

var Collection = Backbone.Collection.extend({
    url: function() { return ohgr.baseUrl + 'permission/user/'; },
    model: PermissionUserModel,

    parse: function(data) {
        if (data.result != 'success')
            return [];

        return data.users;
    },
});

module.exports = Collection;
