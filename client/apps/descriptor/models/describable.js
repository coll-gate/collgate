/**
 * @file describable.js
 * @brief Describable entity model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-11-17
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
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
    url: application.baseUrl + 'descriptor/describable/:id'
});

