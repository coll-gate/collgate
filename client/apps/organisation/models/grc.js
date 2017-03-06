/**
 * @file grc.js
 * @brief GRC model
 * @author Frederic SCHERMA
 * @date 2017-02-28
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: application.baseUrl + 'organisation/grc/',

    defaults: {
        id: null,
        identifier: "",
        name: "",
        description: ""
    }
});

module.exports = Model;
