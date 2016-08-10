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
    url: function() {
        return ohgr.baseUrl + 'audit/search/';
    },
    model: AuditModel,

    initialize: function(models, options) {
        options || (options = {});

         if (typeof(options.username) !== "undefined") {
             this.username = options.username;
        } else if (typeof(options.entity) !== "undefined") {
             this.entity = options.entity; /*{
                 app_label: options.app_label,
                 model: options.model,
                 object_id: options.object_id
            }*/
        }
    },

    parse: function(data) {
        this.page = data.page;
        this.total_count = data.total_count;

        this.perms = data.perms;
        return data.items;
    },

    fetch: function(options) {
        options || (options = {});
        var data = (options.data || {});

        if (typeof(this.username) !== "undefined") {
            data.username = this.username;
        } else if (typeof(this.entity) !== "undefined") {
            data.app_label = this.entity.app_label;
            data.model = this.entity.model;
            data.object_id = this.entity.object_id;
        }

        options.data = data;

        return Backbone.Collection.prototype.fetch.call(this, options);
    }
});

module.exports = Collection;
