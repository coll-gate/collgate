/**
 * @file language.js
 * @brief Language collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let CacheCollection = require('../collections/cachedcollection');
let LanguageModel = require('../models/language');

let LanguageCollection = CacheCollection.extend({
    url: window.application.url(['main', 'language']),
    model: LanguageModel,

    cache: function() {
        return {
            category: 'main',
            key: 'languages:' + window.session.language
        }
    },

    initialize: function (options) {
        options || (options = {});

        LanguageCollection.__super__.initialize.apply(this, arguments);
    },

    parse: function(data) {
        return data;
    },

    comparator: 'code',

    default: [
        {id: 'en', value: 'en', label: _t("English")},
        {id: 'fr', value: 'fr', label: _t("French")},
        {id: 'la', value: 'la', label: _t("Latin")}
    ],

    findLabel: function(value) {
        let res = this.findWhere({value: value});
        return res ? res.get('label') : '';
    },
});

module.exports = LanguageCollection;
