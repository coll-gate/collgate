/**
 * @file organisationtype.js
 * @brief Type of organisation collection
 * @author Frederic SCHERMA
 * @date 2017-03-06
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var OrganisationTypeModel = require('../models/organisationtype');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'organisation/organisation-type/',
    model: OrganisationTypeModel,

    parse: function(data) {
        return data;
    },

    default: [],

    findLabel: function(value) {
        var res = this.findWhere({value: value});
        return res ? res.get('label') : '';
    }
});

module.exports = Collection;