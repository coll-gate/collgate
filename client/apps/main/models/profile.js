/**
 * @file profile.js
 * @brief Profile model
 * @author Frederic SCHERMA
 * @date 2016-08-29
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
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
