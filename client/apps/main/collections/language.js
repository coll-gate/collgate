/**
 * @file language.js
 * @brief Language collection
 * @author Frederic SCHERMA
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var LanguageModel = require('../models/language');

var LanguageCollection = Backbone.Collection.extend({
    url: application.baseUrl + 'main/language/',
    model: LanguageModel,

    parse: function(data) {
        return data;
    },

    default: [
        {id: 'en', value: 'en', label: gt.gettext("English")},
        {id: 'fr', value: 'fr', label: gt.gettext("French")}
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
