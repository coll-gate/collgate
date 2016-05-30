/**
 * @file user.js
 * @brief Permission user collection
 * @author Frederic SCHERMA
 * @date 2016-05-30
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var PermissionGroupModel = require('../models/group');

var Collection = Backbone.Collection.extend({
    url: function() { return ohgr.baseUrl + 'permission/group/'; },
    model: PermissionGroupModel,

    parse: function(data) {
        if (data.result != 'success')
            return [];

        return data.groups;
    },
});

module.exports = Collection;
