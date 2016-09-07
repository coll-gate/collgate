/**
 * @file permissiontype.js
 * @brief Permission type model
 * @author Frederic SCHERMA
 * @date 2016-04-30
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

module.exports = Backbone.Model.extend({
    url: application.baseUrl + 'permission/type/:id',

    defaults: function() {
        return {
            id: 0,
            value: '',
            name: ''
        }
    }
});
