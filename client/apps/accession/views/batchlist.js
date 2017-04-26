/**
 * @file batchlist.js
 * @brief Batch list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var BatchView = require('../views/batch');
var ScrollView = require('../../main/views/scroll');
var DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

var View = ScrollView.extend({
    template: require("../templates/batchlist.html"),
    className: "batch-list advanced-table-container",
    childView: BatchView,
    childViewContainer: 'tbody.batch-list',
    userSettingName: 'batches_list_columns',

    templateHelpers/*templateContext*/: function () {
        return {
            columns: this.displayedColumns
        }
    },

    childViewOptions: function () {
        return {
            columns: this.displayedColumns
        }
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this);

        // this.listenTo(this.collection, 'reset', this.render, this);
    },

    onShowTab: function() {
        var view = this;

        var contextLayout = application.getView().getRegion('right').currentView;
        if (!contextLayout) {
            var DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            application.getView().getRegion('right').show(contextLayout);
        }

        var TitleView = require('../../main/views/titleview');
        contextLayout.getRegion('title').show(new TitleView({title: gt.gettext("Batches actions")}));

        var actions = ['create'];

        var AccessionBatchesContextView = require('./accessionbatchescontext');
        var contextView = new AccessionBatchesContextView({actions: actions});
        contextLayout.getRegion('content').show(contextView);

        contextView.on("batch:create", function () {
            view.onCreate();
        });
    },

    onHideTab: function() {
        application.main.defaultRightView();
    },

    onCreate: function () {
        alert();
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
