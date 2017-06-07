/**
 * @file language.js
 * @brief Language collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var LanguageModel = require('../models/language');

var LanguageCollection = Backbone.Collection.extend({
    url: application.baseUrl + 'main/language/',
    model: LanguageModel,

    parse: function(data) {
        return data;
    },

    comparator: 'code',

    default: [
        {id: 'en', value: 'en', label: gt.gettext("English")},
        {id: 'fr', value: 'fr', label: gt.gettext("French")},
        {id: 'la', value: 'la', label: gt.gettext("Latin")}
    ],

    findLabel: function(value) {
        var res = this.findWhere({value: value});
        return res ? res.get('label') : '';
        /*for (var r in this.models) {
            var m = this.models[r];
            if (m.get('value') == value)
                return m.get('label');
        }*/
    },
});

module.exports = LanguageCollection;

