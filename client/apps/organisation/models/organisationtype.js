/**
 * @file organisationtype.js
 * @brief Type of organisatin model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-06
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

module.exports = Backbone.Model.extend({
    defaults: function() {
        return {
            id: 0,
            value: '',
            label: ''
        }
    },
    url: window.application.url(['organisation', 'organisation-type', ':id'])
});

