/**
 * @file uilanguage.js
 * @brief Interface language collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-11-10
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let InterfaceLanguageModel = require('../models/uilanguage');

let Collection = Backbone.Collection.extend({
    url: window.application.url(['main', 'ui', 'language']),
    model: InterfaceLanguageModel,

    parse: function(data) {
        return data;
    },

    default: [
        {id: 'en', value: 'en', label: _t("English")},
        {id: 'fr', value: 'fr', label: _t("French")}
    ],

    findLabel: function(value) {
        let res = this.findWhere({value: value});
        return res ? res.get('label') : '';
    },
});

module.exports = Collection;
