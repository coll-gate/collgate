/**
 * @file descriptortypeunit.js
 * @brief Descriptor type unit model
 * @author Frederic SCHERMA
 * @date 2017-01-04
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
    url: application.baseUrl + 'descriptor/typeunit/:id'
});
