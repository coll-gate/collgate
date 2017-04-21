/**
 * @file uilanguage.js
 * @brief Interface language model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-11-10
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
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

