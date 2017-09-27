/**
 * @file panellayout.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-09-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var LayoutView = require('../../main/views/layout');
var ContentBottomLayout = require('../../main/views/contentbottomlayout');
var ScrollingMoreView = require('../../main/views/scrollingmore');

var Layout = LayoutView.extend({
    template: require("../templates/panellayout.html"),

    ui: {
        accessions_tab: 'a[aria-controls=accessions]'
    },

    regions: {
        'descriptors': "div.tab-pane[name=descriptors]",
        'accessions': "div.tab-pane[name=accessions]"
    },

    initialize: function (options) {
        Layout.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change:descriptor_meta_model', this.onDescriptorMetaModelChange, this);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onPanelCreate, this);
        }
    },

    onPanelCreate: function (model, value) {
        // re-render once created
        this.render();

        // and update history
        Backbone.history.navigate('app/accession/panel/' + this.model.get('id') + '/', {
            /*trigger: true,*/
            replace: false
        });
    },


    disableEntitiesTab: function () {
        this.ui.accessions_tab.parent().addClass('disabled');
    },

    enableTabs: function () {
        this.ui.accessions_tab.parent().removeClass('disabled');
    },

    onDescriptorMetaModelChange: function (model, value) {
        var panelLayout = this;
        if (value == null) {
            var AccessionPanelDescriptorCreateView = require('./accessionpaneldescriptorcreate');
            var accessionPanelDescriptorCreateView = new AccessionPanelDescriptorCreateView({model: model});

            this.showChildView('descriptors', accessionPanelDescriptorCreateView);

        } else {
            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: application.baseUrl + 'descriptor/meta-model/' + value + '/layout/',
                dataType: 'json'
            }).done(function (data) {
                var PanelDescriptorView = require('../views/accessionpaneldescriptor');
                var panelDescriptorView = new PanelDescriptorView({
                    model: model,
                    descriptorMetaModelLayout: data
                });
                panelLayout.showChildView('descriptors', panelDescriptorView);
            });
        }
    },

    onRender: function () {
        var panelLayout = this;

        if (this.model.isNew()) {
            this.model.save();
        }

        // accession tab
        var AccessionCollection = require('../collections/accession');
        var accessionPanelAccessions = new AccessionCollection([], {panel_id: this.model.get('id')});

        // get available columns
        var columns = $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/columns/accession.accession/',
            contentType: "application/json; charset=utf-8"
        });

        columns.done(function (data) {
            var AccessionListView = require('../views/accessionlist');
            var accessionListView = new AccessionListView({
                collection: accessionPanelAccessions, model: panelLayout.model, columns: data.columns
            });

            var contentBottomLayout = new ContentBottomLayout();
            panelLayout.showChildView('accessions', contentBottomLayout);

            contentBottomLayout.showChildView('content', accessionListView);
            contentBottomLayout.showChildView('bottom', new ScrollingMoreView({targetView: accessionListView}));

            accessionListView.query();
        });

        this.onDescriptorMetaModelChange(this.model, this.model.get('descriptor_meta_model'));
        this.enableTabs();

    }
});

module.exports = Layout;
