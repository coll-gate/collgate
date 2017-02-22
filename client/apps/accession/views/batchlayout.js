/**
 * @file batchlayout.js
 * @brief Optimized layout for batch details
 * @author Frederic SCHERMA
 * @date 2017-02-15
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var AccessionModel = require('../models/accession');
var BatchModel = require('../models/batch');

var BatchPathView = require('../views/batchpath');
var BatchDescriptorView = require('../views/batchdescriptor');


var Layout = Marionette.LayoutView.extend({
    template: require("../templates/batchlayout.html"),

    attributes: {
        style: "height: 100%;"
    },

    ui: {
        tabs: 'a[data-toggle="tab"]',
        initial_pane: 'div.tab-pane.active',
        descriptors_tab: 'a[aria-controls=descriptors]',
        batches_tab: 'a[aria-controls=batches]'
    },

    regions: {
        'details': "div[name=details]",
        'descriptors': "div.tab-pane[name=descriptors]",
        'batches': "div.tab-pane[name=batches]"
    },

    childEvents: {
        'dom:refresh': function(child) {
            var tab = this.$el.find('div.tab-pane.active').attr('name');
            var region = this.getRegion(tab);

            // update child of current tab
            if (region && child && region.currentView == child) {
                if (region.currentView.onShowTab) {
                    region.currentView.onShowTab(this);
                }
            }
        }
    },

    initialize: function(model, options) {
        Layout.__super__.initialize.apply(this, arguments);

        this.activeTab = undefined;
        this.listenTo(this.model, 'change:descriptor_meta_model', this.onDescriptorMetaModelChange, this);
    },

    disableBatchesTab: function () {
        this.ui.batches_tab.parent().addClass('disabled');
    },

    onDescriptorMetaModelChange: function(model, value) {
        if (value == null) {
            this.getRegion('descriptors').empty();
        } else {
            var batchLayout = this;

            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: application.baseUrl + 'descriptor/meta-model/' + value + '/layout/',
                dataType: 'json'
            }).done(function (data) {
                var BatchDescriptorView = require('../views/batchdescriptor');
                var batchDescriptorView = new BatchDescriptorView({
                    model: model,
                    descriptorMetaModelLayout: data
                });
                batchLayout.getRegion('descriptors').show(batchDescriptorView);

                // manually called
                if (batchLayout.activeTab === 'descriptors') {
                    batchDescriptorView.onShowTab();
                }
            });
        }
    },

    onRender: function() {
        var batchLayout = this;

        this.activeTab = this.ui.initial_pane.attr('name');

        this.ui.tabs.on("shown.bs.tab", $.proxy(this.onShowTab, this));
        this.ui.tabs.on("hide.bs.tab", $.proxy(this.onHideTab, this));

        // details view @todo
        var accession = new AccessionModel({id: this.model.get('accession')});
        accession.fetch().then(function() {
            batchLayout.getRegion('details').show(new BatchPathView({model: batchLayout.model, taxon: taxon}));
        });

        // batches tab
        // @todo
    },

    onShowTab: function(e) {
        // e.target current tab, e.relatedTarget previous tab
        var tab = e.target.getAttribute('aria-controls');
        this.activeTab = tab;

        var region = this.getRegion(tab);
        if (region && region.currentView && region.currentView.onShowTab) {
            region.currentView.onShowTab();
        }
    },

    onHideTab: function(e) {
        var tab = e.target.getAttribute('aria-controls');

        var region = this.getRegion(tab);
        if (region && region.currentView && region.currentView.onHideTab) {
            region.currentView.onHideTab();
        }

        application.main.defaultRightView();
    },

    onDestroy: function() {
        application.main.defaultRightView();
    }
});

module.exports = Layout;
