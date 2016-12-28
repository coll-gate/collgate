/**
 * @file taxonentity.js
 * @brief Taxon entity item view
 * @author Frederic SCHERMA
 * @date 2016-12-28
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    template: require('../templates/taxonentity.html'),
    taxon: null,

    ui: {
        view_entity: ".view-entity",
        content_type: "td.entity-type > abbr.content-type"
    },

    events: {
        'click @ui.view_entity': 'onViewEntity',
    },

    initialize: function(options) {
        this.mergeOptions(options, ['taxon']);

        this.listenTo(this.model, 'reset', this.render, this);
        this.listenTo(this.entity, 'change', this.render, this);
    },

    onRender: function() {
        application.main.views.contentTypes.htmlFromValue(this.el);
    },

    onViewEntity: function(e) {
        var path = this.model.get('content_type').replace('.', '/');
        Backbone.history.navigate("app/" + path + "/" + this.model.get('id') + "/", {trigger: true});
    },
});

module.exports = View;
