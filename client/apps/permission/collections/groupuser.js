/**
 * @file groupuser.js
 * @brief Permission user collection from a group
 * @author Frederic SCHERMA
 * @date 2016-06-09
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var PermissionGroupUserModel = require('../models/groupuser');

var Collection = Backbone.Collection.extend({
    url: function() { return ohgr.baseUrl + 'permission/group/' + this.name + '/user/'; },
    model: PermissionGroupUserModel,

    initialize: function(models, options) {
        options || (options = {});
        this.name = options.name;
    },

    parse: function(data) {
        this.perms = data.perms;
        return data.users;
    },
});

module.exports = Collection;
