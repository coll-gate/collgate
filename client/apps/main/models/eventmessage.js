/**
 * @file eventmessage.js
 * @brief Event message model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-02
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Model = Backbone.Model.extend({
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

