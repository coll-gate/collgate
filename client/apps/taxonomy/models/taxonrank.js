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
    defaults: function() {
        return {id: '', value: ''}
    },
    url: ohgr.baseUrl + 'taxonomy/rank/:id'
});
