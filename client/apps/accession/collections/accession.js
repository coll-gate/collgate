/**
 * @file accession.js
 * @brief Accession collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-09
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var AccessionModel = require('../models/accession');
var CountableCollection = require('../../main/collections/countable');

var Collection = CountableCollection.extend({
    model: AccessionModel,

    url: function() {
        if (this.panel_id) {
            return window.application.url(['accession', 'accessions_panel', this.panel_id, 'accessions']);
        } else {
            return window.application.url(['accession', 'accession']);
        }
    },

    initialize: function (models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        this.panel_id = (options.panel_id || null);
    },
});

module.exports = Collection;
