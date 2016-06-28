/**
 * @file audit.js
 * @brief Audit collection
 * @author Frederic SCHERMA
 * @date 2016-06-24
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var AuditModel = require('../models/audit');

var Collection = Backbone.Collection.extend({
    url: function() { return ohgr.baseUrl + 'audit/search/'; },
    model: AuditModel,

    parse: function(data) {
        this.perms = data.perms;
        return data.audits;
    },
});

module.exports = Collection;
