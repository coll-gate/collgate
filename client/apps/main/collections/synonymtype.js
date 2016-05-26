/**
 * @file synonymtype.js
 * @brief Taxon synonym type collection
 * @author Frederic SCHERMA
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var SynonymTypeModel = require('../models/synonymtype');

var SynonymTypeCollection = Backbone.Collection.extend({
    url: ohgr.baseUrl + 'synonym-type/',
    model: SynonymTypeModel,

    parse: function(data) {
        return data;
    },

    default: [
    ],
    
    findValue: function(id) {
        for (var r in this.models) {
            var m = this.models[r];
            if (m.get('id') == id)
                return m.get('value');
        }
    },
});

module.exports = SynonymTypeCollection;
