/**
 * @file profile.js
 * @brief Profile model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-08-29
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

module.exports = Backbone.Model.extend({
    defaults: function() {
        return {
            id: '',
            username: '',
            first_name: '',
            last_name: '',
            email: ''
        }
    },

    url: function() {
        return application.baseUrl + 'main/profile/';
    }
});

