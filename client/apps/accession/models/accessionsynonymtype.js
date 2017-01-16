/**
 * @file accessionsynonymtype.js
 * @brief Accession synonym type model
 * @author Frederic SCHERMA
 * @date 2017-01-16
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

module.exports = Backbone.Model.extend({
    url: application.baseUrl + 'accession/accession-synonym-type/:id',

    defaults: function() {
        return {
            id: 0,
            value: 0,
            label: ''
        }
    },
});
