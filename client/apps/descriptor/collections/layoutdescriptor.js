/**
 * @file descriptorlayout.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-01-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let layoutDescriptorModel = require('../models/layoutdescriptor');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: function() {
        return window.application.url(['descriptor', 'layout', this.model_id, 'descriptor']);
    },
    model: layoutDescriptorModel,
    comparator: 'position',

    initialize: function(models, options) {
        options || (options = {});
        this.model_id = options.model_id;
        this.panel_index = options.panel_index;
    },

    fetch: function(options) {
        options || (options = {});
        let data = (options.data || {});

        let opts = _.clone(options);
        opts.data = data;

        if (this.panel_index || this.panel_index === 0) {
            opts.data.panel_index = JSON.stringify(this.panel_index)
        }
        return CountableCollection.prototype.fetch.call(this, opts);
    },

});

module.exports = Collection;