/**
 * @file formatunit.js
 * @brief Descriptor type format unit model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-04
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

module.exports = Backbone.Model.extend({
    defaults: function() {
        return {
            id: 0,
            value: '',
            label: '',
            group: '',
            group_label: ''
        }
    },
    url: application.baseUrl + 'descriptor/format/unit/:id'
});

