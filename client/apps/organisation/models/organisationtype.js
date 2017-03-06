/**
 * @file organisationtype.js
 * @brief Type of organisatin model
 * @author Frederic SCHERMA
 * @date 2017-03-06
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
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
    url: application.baseUrl + 'organisation/organisation-type/:id/'
});
