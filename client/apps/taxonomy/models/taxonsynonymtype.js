/**
 * @file taxonsynonymtype.js
 * @brief Taxon synonym type model
 * @author Frederic SCHERMA
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
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
