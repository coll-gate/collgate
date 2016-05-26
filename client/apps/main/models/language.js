/**
 * @file language.js
 * @brief Language model
 * @author Frederic SCHERMA
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

module.exports = Backbone.Model.extend({
    defaults: function() {
        return {id: '', value: ''}
    },
    url: ohgr.baseUrl + 'language/:id'
});
