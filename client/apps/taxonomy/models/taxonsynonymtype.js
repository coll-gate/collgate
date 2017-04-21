/**
 * @file taxonsynonymtype.js
 * @brief Taxon synonym type model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

module.exports = Backbone.Model.extend({
    url: application.baseUrl + 'taxonomy/taxon-synonym-type/:id',

    defaults: function() {
        return {
            id: 0,
            value: 0,
            label: ''
        }
    },
});

