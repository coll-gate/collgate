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

var ScrollingMoreView = require('../../main/views/scrollingmore');
var ContentBottomFooterLayout = require('../../main/views/contentbottomfooterlayout');
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

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onOrganisationCreate, this);
        }
    },

    onOrganisationCreate: function(model, value) {
        // re-render once created
        this.render();

        // and update history
        Backbone.history.navigate('app/organisation/organisation/' + this.model.get('id') + '/', {/*trigger: true,*/ replace: false});
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

                var contentBottomFooterLayout = new ContentBottomFooterLayout();
                organisationLayout.getRegion('establishments').show(contentBottomFooterLayout);

                contentBottomFooterLayout.getRegion('content').show(establishmentListView);
                contentBottomFooterLayout.getRegion('bottom').show(new ScrollingMoreView({targetView: establishmentListView}));

                var EstablishmentListFilterView = require('./establishmentlistfilter');
                contentBottomFooterLayout.getRegion('footer').show(new EstablishmentListFilterView({
                    organisation: organisationLayout.model,
                    collection: establishments
                }));
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

    onBeforeAttach: function() {
        this.activeTab = this.ui.initial_pane.attr('name');

        this.ui.tabs.on("shown.bs.tab", $.proxy(this.onShowTab, this));
        this.ui.tabs.on("hide.bs.tab", $.proxy(this.onHideTab, this));
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
