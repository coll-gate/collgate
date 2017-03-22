/**
 * @file config.js
 * @brief Config model
 * @author Frederic SCHERMA
 * @date 2017-03-22
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
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
