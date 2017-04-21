/**
 * @file config.js
 * @brief Config model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-22
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

module.exports = Backbone.Model.extend({
    url: application.baseUrl + 'main/config/:id/',

    defaults: function() {
        return {
            id: 0,
            module: '',
            values: []
        }
    }
});

