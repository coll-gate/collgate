/**
 * @file synonymtype.js
 * @brief Synonym type model
 * @author Frederic SCHERMA
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

module.exports = Backbone.Model.extend({
    url: ohgr.baseUrl + 'synonym-type/:id',

    defaults: function() {
        return {id: '', value: ''}
    },
});
