/**
 * @file entitysynonymtype.js
 * @brief Entity synonym type collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let EntitySynonymTypeModel = require('../models/entitysynonymtype');

let Collection = Backbone.Collection.extend({
    url: function() {
        if (this.target_model) {
            return window.application.url(['main', 'entity-synonym-type', this.target_model, 'values']);
        } else {
            return window.application.url(['main', 'entity-synonym-type']);
        }
    },
    model: EntitySynonymTypeModel,

    initialize: function(models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        this.target_model = options.target_model || null;
    },

    findValue: function(id) {
        for (let r in this.models) {
            let m = this.models[r];
            if (m.get('id') === id)
                return m.get('name');
        }
    },

    findLabel: function(name) {
        for (let r in this.models) {
            let m = this.models[r];
            if (m.get('name') === name)
                return m.get('label');
        }
    }
});

module.exports = Collection;
