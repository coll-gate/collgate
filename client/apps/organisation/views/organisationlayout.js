/**
 * @file organisationlayout.js
 * @brief Optimized layout for organisation details
 * @author Frederic SCHERMA
 * @date 2017-03-07
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var LayoutView = require('../../main/views/layout');
var ScrollingMoreView = require('../../main/views/scrollingmore');
var ContentBottomFooterLayout = require('../../main/views/contentbottomfooterlayout');
var OrganisationDetailsView = require('../views/organisationdetails');
var DescriptorEditView = require('../views/descriptoredit');


var Layout = LayoutView.extend({
    template: require("../templates/organisationlayout.html"),

    ui: {
        establishments_tab: 'a[aria-controls=establishments]'
    },

    regions: {
        'details': "div[name=details]",
        'descriptors': "div.tab-pane[name=descriptors]",
        'establishments': 'div.tab-pane[name=establishments]'
    },

    initialize: function(options) {
        Layout.__super__.initialize.apply(this, arguments);

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
    }
});

module.exports = Layout;
