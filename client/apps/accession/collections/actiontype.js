/**
 * @file actiontype.js
 * @brief Action type collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-23
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let BatchActionTypeModel = require('../models/actiontype');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: window.application.url(['accession', 'actiontype']),
    model: BatchActionTypeModel,

    initialize: function (models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);
    },

    findValue: function(id) {
        for (let r in this.models) {
            let m = this.models[r];
            if (m.get('id') === id)
                return m.get('value');
        }
    },

    findLabel: function(value) {
        for (let r in this.models) {
            let m = this.models[r];
            if (m.get('value') === value)
                return m.get('label');
        }
    }
});

module.exports = Collection;
