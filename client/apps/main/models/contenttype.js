/**
 * @file contenttype.js
 * @brief Content type model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-08
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

module.exports = Backbone.Model.extend({
    url: window.application.url(['main', 'content-type', ':id']),

    defaults: function() {
        return {
            id: 0,
            value: '',
            label: '',
            group: ''
        }
    }
});

