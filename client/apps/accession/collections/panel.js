/**
 * @file panel.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-09-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var PanelModel = require('../models/panel');
var CountableCollection = require('../../main/collections/countable');

var Collection = CountableCollection.extend({
    url: window.application.url(['accession', 'accessionpanel']),
    model: PanelModel,

    initialize: function (options) {
        options || (options = {});
        this.accession_id = options.accession_id;
        Collection.__super__.initialize.apply(this, arguments);
    }
});

module.exports = Collection;
