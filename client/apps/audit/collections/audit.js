/**
 * @file audit.js
 * @brief Audit collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-24
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var AuditModel = require('../models/audit');

var Collection = Backbone.Collection.extend({
    url: function() {
        return window.application.url(['audit' ,'search']);
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
        this.prev = data.prev;
        this.page = data.page;
        this.next = data.next;

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

