/**
 * @file audit.js
 * @brief Audit item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-24
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
// let AuditModel = require('../models/audit');

let View = Marionette.View.extend({
    tagName: 'tr',
    className: 'object audit element',
    attributes: {
        'scope': 'row',
    },
    template: require('../templates/audit.html'),

    ui: {
        show: 'span.show-entity',
        datetime: 'td abbr.datetime'
    },

    events: {
        'click @ui.show': 'showEntity',
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        // localize content-type
        application.main.views.contentTypes.htmlFromValue(this.el);
        // and date-time
        this.ui.datetime.localizeDate(null, session.language);
    },

    showEntity: function () {
        alert("Not yet implemented !");
    }
});

module.exports = View;
