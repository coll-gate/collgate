/**
 * @file uilanguage.js
 * @brief Interface language collection
 * @author Frederic SCHERMA
 * @date 2016-11-10
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var InterfaceLanguageModel = require('../models/uilanguage');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'main/ui/language/',
    model: InterfaceLanguageModel,

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
    },
});

module.exports = Collection;
