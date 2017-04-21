/**
 * @file permissiontype.js
 * @brief Permission type model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-30
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
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

