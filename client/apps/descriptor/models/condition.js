/**
 * @file condition.js
 * @brief Condition entity model
 * @author Frederic SCHERMA
 * @date 2016-11-22
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

module.exports = Backbone.Model.extend({
    defaults: function() {
        return {
            id: '',
            value: '',
            label: ''
        }
    },
    url: application.baseUrl + 'descriptor/condition/:id'
});
