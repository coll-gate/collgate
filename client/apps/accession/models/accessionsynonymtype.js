/**
 * @file accessionsynonymtype.js
 * @brief Accession synonym type model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-16
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

module.exports = Backbone.Model.extend({
    url: application.baseUrl + 'accession/accession-synonym-type/:id/',

    defaults: function() {
        return {
            id: 0,
            value: 0,
            label: ''
        }
    },
});

