/**
 * @file panel.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-09-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let PanelModel = require('../models/panel');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: function () {
        if (this.accession_id) {
            return window.application.url(['accession', 'accession', this.accession_id, 'panels'])
        } else {
            return window.application.url(['accession', 'accessionpanel'])
        }
    },
    model: PanelModel,

    initialize: function (options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        this.accession_id = options.accession_id;
    }
});

module.exports = Collection;
