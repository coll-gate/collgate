/**
 * @file contenttype.js
 * @brief Content type model
 * @author Frederic SCHERMA
 * @date 2016-07-08
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

module.exports = Backbone.Model.extend({
    url: application.baseUrl + 'main/content-type/:id/',

    defaults: function() {
        return {
            id: '',
            name: '',
            value: ''
        }
    }
});
