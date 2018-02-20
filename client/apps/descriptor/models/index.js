/**
 * @file index.js
 * @brief index of descriptor
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-02-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return window.application.url(['descriptor', 'index']);
        else
            return window.application.url(['descriptor', 'index', this.get('id')]);
    },

    defaults: {
        id: null,
        descriptor: null,
        target: null,
        type: null,
    },
});

module.exports = Model;