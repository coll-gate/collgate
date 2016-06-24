/**
 * @file audit.js
 * @brief Audit item view
 * @author Frederic SCHERMA
 * @date 2016-06-24
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var AuditModel = require('../models/audit');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object audit',
    template: require('../templates/audit.html'),

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
    },
});

module.exports = View;
