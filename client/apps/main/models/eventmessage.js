/**
 * @file eventmessage.js
 * @brief Event message model
 * @author Frederic SCHERMA
 * @date 2017-02-02
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Model = Backbone.Model.extend({
    defaults: function() {
        return {
            id: null,
            created_date: '',
            author: null,
            author_details: {
                first_name: '',
                last_name: ''
            },
            message: ''
        }
    }
});

module.exports = Model;
