/**
 * @file uilanguage.js
 * @brief Interface language model
 * @author Frederic SCHERMA
 * @date 2016-11-10
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
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
    url: application.baseUrl + 'main/ui/language/:id'
});
