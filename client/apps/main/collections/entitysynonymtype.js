/**
 * @file entitysynonymtype.js
 * @brief Entity synonym type collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var EntitySynonymTypeModel = require('../models/entitysynonymtype');

var Collection = Backbone.Collection.extend({
    url: function() {
        if (this.target_model) {
            return application.baseUrl + 'main/entity-synonym-type/' + this.target_model + '/values/';
        } else {
            return application.baseUrl + 'main/entity-synonym-type/';
        }
    },
    model: EntitySynonymTypeModel,

    initialize: function(models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        this.target_model = options.target_model || null;
    },

    findValue: function(id) {
        for (var r in this.models) {
            var m = this.models[r];
            if (m.get('id') === id)
                return m.get('name');
        }
    },

    findLabel: function(name) {
        for (var r in this.models) {
            var m = this.models[r];
            if (m.get('name') === name)
                return m.get('label');
        }
    }
});

module.exports = Collection;
