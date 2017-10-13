/**
 * @file organisation.js
 * @brief Organisation collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-28
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var OrganisationModel = require('../models/organisation');
var CountableCollection = require('../../main/collections/countable');

var Collection = CountableCollection.extend({
    url: function() {
        if (this.grc) {
            return window.application.url(['organisation', 'grc', 'organisation']);
        } else {
            return window.application.url(['organisation', 'organisation']);
        }
    },
    model: OrganisationModel,

    // comparator: 'name',

    initialize: function(models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        this.grc = options.grc || false;
    }
});

module.exports = Collection;
