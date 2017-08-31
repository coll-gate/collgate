/**
 * @file classificationentryentity.js
 * @brief Classification entry entity item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-28
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'tr',
    template: require('../templates/classificationentryentity.html'),
    className: "element",
    classificationEntry: null,

    ui: {
        view_entity: ".view-entity",
        content_type: "td.entity-type > abbr.content-type"
    },

    events: {
        'click @ui.view_entity': 'onViewEntity'
    },

    initialize: function(options) {
        this.mergeOptions(options, ['classificationEntry']);

        this.listenTo(this.model, 'change', this.render, this);
        this.listenTo(this.entity, 'change', this.render, this);
    },

    onRender: function() {
        application.main.views.contentTypes.htmlFromValue(this.el);
    },

    onViewEntity: function(e) {
        var path = this.model.get('content_type').replace('.', '/');
        Backbone.history.navigate("app/" + path + "/" + this.model.get('id') + "/", {trigger: true});
    }
});

module.exports = View;
