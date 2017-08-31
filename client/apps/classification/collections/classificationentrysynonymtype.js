/**
 * @file classificationentrysynonymtype.js
 * @brief Classification entry synonym type collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var ClassificationEntrySynonymTypeModel = require('../models/classificationentrysynonymtype');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'classification/classification-entry-synonym-type/',
    model: ClassificationEntrySynonymTypeModel,

    findValue: function(id) {
        for (var r in this.models) {
            var m = this.models[r];
            if (m.get('id') === id)
                return m.get('value');
        }
    },

    findLabel: function(value) {
        for (var r in this.models) {
            var m = this.models[r];
            if (m.get('value') === value)
                return m.get('label');
        }
    }
});

module.exports = Collection;
