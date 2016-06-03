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
    url: ohgr.baseUrl + 'language',
    model: LanguageModel,

    parse: function(data) {
        return data;
    },

    default: [
        {value: 'en', name: gt.gettext("English")},
        {value: 'fr', name: gt.gettext("French")},
    ],

    findValue: function(id) {
        var res = this.findWhere({id: id});
        return res ? res.get('value') : '';
        /*for (var r in this.models) {
            var m = this.models[r];
            if (m.get('id') == id)
                return m.get('value');
        }*/
    },
});

module.exports = LanguageCollection;
