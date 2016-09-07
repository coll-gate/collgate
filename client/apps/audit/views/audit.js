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
    className: 'object audit',
    attributes: {
        'scope': 'row',
    },
    template: require('../templates/audit.html'),

    ui: {
        show: 'span.show-entity',
    },

    events: {
        'click @ui.show': 'showEntity',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        $(this.el).find("td abbr.datetime").localizeDate(null, session.language);
    },

    showEntity: function () {
        alert();
    }
});

module.exports = View;
