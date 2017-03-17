/**
 * @file organisationlayout.js
 * @brief Optimized layout for organisation details
 * @author Frederic SCHERMA
 * @date 2017-03-07
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var TitleView = require('../../main/views/titleview');
var ScrollingMoreView = require('../../main/views/scrollingmore');
var ContentBottomLayout = require('../../main/views/contentbottomlayout');
var OrganisationDetailsView = require('../views/organisationdetails');
var DescriptorEditView = require('../views/descriptoredit');


var Layout = Marionette.LayoutView.extend({
    template: require("../templates/organisationlayout.html"),

    attributes: {
        style: "height: 100%;"
    },

    ui: {
        tabs: 'a[data-toggle="tab"]',
        initial_pane: 'div.tab-pane.active',
        establishments_tab: 'a[aria-controls=establishments]'
    },

    regions: {
        'details': "div[name=details]",
        'descriptors': "div.tab-pane[name=descriptors]",
        'establishments': 'div.tab-pane[name=establishments]',
        'entities': "div.tab-pane[name=entities]"
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

    onDescriptorMetaModelChange: function(model, value) {
        if (value == null) {
            this.getRegion('descriptors').empty();
        } else {
            var organisationLayout = this;

            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: application.baseUrl + 'descriptor/meta-model/' + value + '/layout/',
                dataType: 'json'
            }).done(function (data) {
                var DescriptorView = require('../views/descriptor');
                var descriptorView = new DescriptorView({
                    model: model,
                    descriptorMetaModelLayout: data
                });
                organisationLayout.getRegion('descriptors').show(descriptorView);
            });
        }
    },

    disableEstablishmentTab: function () {
        this.ui.establishments_tab.parent().addClass('disabled');
    },

    onRender: function() {
        var organisationLayout = this;

        this.activeTab = this.ui.initial_pane.attr('name');

        this.ui.tabs.on("shown.bs.tab", $.proxy(this.onShowTab, this));
        this.ui.tabs.on("hide.bs.tab", $.proxy(this.onHideTab, this));

        // details view
        if (!this.model.isNew()) {
            // details view
            organisationLayout.getRegion('details').show(new OrganisationDetailsView({model: this.model}));

            // establishments tab
            var EstablishmentCollection = require('../collections/establishment');
            var establishments = new EstablishmentCollection([], {organisation_id: this.model.get('id')});

            establishments.fetch().then(function() {
                var EstablishmentListView = require('../views/establishmentlist');
                var establishmentListView  = new EstablishmentListView({collection: establishments, model: organisationLayout.model});

                var contentBottomLayout = new ContentBottomLayout();
                organisationLayout.getRegion('establishments').show(contentBottomLayout);

                contentBottomLayout.getRegion('content').show(establishmentListView);
                contentBottomLayout.getRegion('bottom').show(new ScrollingMoreView({targetView: establishmentListView}));

                // how and where ?
                // var EstablishmentListFilterView = require('./establishmentlistfilter');
                // contentBottomLayout.getRegion('footer').show(new EstablishmentListFilterView({collection: establishments}));
            });

            // if necessary enable tabs
            this.ui.establishments_tab.parent().removeClass('disabled');
        } else {
            // details
            organisationLayout.getRegion('details').show(new OrganisationDetailsView({model: this.model}));

            // descriptors edit tab
            $.ajax({
                method: "GET",
                url: application.baseUrl + 'descriptor/meta-model/' + this.model.get('descriptor_meta_model') + '/layout/',
                dataType: 'json'
            }).done(function(data) {
                var descriptorView = new DescriptorEditView({
                    model: organisationLayout.model, descriptorMetaModelLayout: data});

                organisationLayout.getRegion('descriptors').show(descriptorView);
            });

            // not available tabs
            this.disableEstablishmentTab();
        }
    },

    onShowTab: function(e) {
        // e.target current tab, e.relatedTarget previous tab
        var tab = e.target.getAttribute('aria-controls');
        this.activeTab = tab;

        var region = this.getRegion(tab);
        if (region && region.currentView && region.currentView.onShowTab) {
            region.currentView.onShowTab(this);
        }
    },

    onHideTab: function(e) {
        var tab = e.target.getAttribute('aria-controls');

        var region = this.getRegion(tab);
        if (region && region.currentView && region.currentView.onHideTab) {
            region.currentView.onHideTab(this);
        }

        application.main.defaultRightView();
    },

    onDestroy: function() {
        application.main.defaultRightView();
    }
});

module.exports = Layout;