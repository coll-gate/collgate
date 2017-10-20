/**
 * @file organisation.js
 * @brief Organisation collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-28
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let OrganisationModel = require('../models/organisation');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: function() {
        return window.application.url(['organisation', 'organisation']);
    },
    model: OrganisationModel,

    // comparator: 'name',

    initialize: function(models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);
    }
});

module.exports = Collection;
