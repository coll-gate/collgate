/**
 * @file organisationdetails.js
 * @brief Details view for organisation.
 * @author Frederic SCHERMA
 * @date 2017-03-07
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: "div",
    template: require('../templates/organisationdetails.html'),

    attributes: {
        style: "height: 25px; overflow-y: auto;"
    },

    ui: {
        'organisation_type': '.organisation-type',
        'change_type': '.change-type'
    },

    events: {
        'click @ui.change_type': 'onChangeType'
    },

    initialize: function(options) {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
       application.organisation.views.organisationTypes.htmlFromValue(this.el);
    },

    onChangeType: function () {
        alert("@todo");
    }
});

module.exports = View;
