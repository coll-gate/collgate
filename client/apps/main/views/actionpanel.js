/**
 * @file actionpanel.js
 * @brief Action panel layout.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-02
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
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
        let view = this;
        /*let ActionListView = require('./actionlist');

        application.main.collections.eventMessages.fetch().then(function() {
            view.showChildView('content', new ActionListView({collection: application.main.collections.action}));
        });*/
    },

    onRefreshActions: function () {
        //this.getChildView('content').collection.fetch();
    }
});

module.exports = View;
