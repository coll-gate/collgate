/**
 * @file grc.js
 * @brief GRC model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-28
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: window.application.url(['organisation', 'grc']),

    defaults: {
        id: null,
        identifier: "",
        name: "",
        description: ""
    }
});

module.exports = Model;

