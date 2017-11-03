/**
 * @file organisationtype.js
 * @brief Type of organisation collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-06
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let OrganisationTypeModel = require('../models/organisationtype');

let Collection = Backbone.Collection.extend({
    url: window.application.url(['organisation', 'organisation-type']),
    model: OrganisationTypeModel,

    parse: function(data) {
        return data;
    },

    default: [],

    findLabel: function(value) {
        let res = this.findWhere({value: value});
        return res ? res.get('label') : '';
    }
});

module.exports = Collection;
