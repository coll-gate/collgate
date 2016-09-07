/**
 * @file taxonrank.js
 * @brief Taxon rank model
 * @author Frederic SCHERMA
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

module.exports = Backbone.Model.extend({
    url: application.baseUrl + 'taxonomy/rank/:id',

    defaults: function() {
        return {
            id: 0,
            value: 0,
            label: ''
        }
    }
});
