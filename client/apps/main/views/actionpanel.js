/**
 * @file actionpanel.js
 * @brief Action panel layout.
 * @author Frederic SCHERMA
 * @date 2017-02-02
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.LayoutView.extend({
    className: "action-panel",
    template: require('../templates/actionpanel.html'),

    attributes: {
        'style': 'height: 100%; padding: 5px;'
    },

    regions: {
        'content': 'div.panel-body'
    },

    ui: {
        'refresh': 'span.refresh-actions'
    },

    events: {
        'click @ui.refresh': 'onRefreshActions'
    },

    initialize: function(options) {
    },

    onRender: function() {
        var view = this;
        /*var ActionListView = require('./actionlist');

        application.main.collections.eventMessages.fetch().then(function() {
            view.getRegion('content').show(new ActionListView({collection: application.main.collections.action}));
        });*/
    },

    onRefreshActions: function () {
        //this.getChildView('content').collection.fetch();
    }
});

module.exports = View;