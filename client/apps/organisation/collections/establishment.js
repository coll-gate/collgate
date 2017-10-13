/**
 * @file establishment.js
 * @brief Establishment collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-28
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let EstablishmentModel = require('../models/establishment');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: function () {
        if (this.organisation_id) {
            return window.application.url(['organisation', 'organisation', this.organisation_id, 'establishment']);
        } else {
            return window.application.url(['organisation', 'establishment']);
        }
    },
    model: EstablishmentModel,

    // comparator: 'name',

    initialize: function(models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        if (options.organisation_id) {
            this.organisation_id = options.organisation_id;
        }
    }
});

module.exports = Collection;
