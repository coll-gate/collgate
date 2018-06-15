/**
 * @file organisationlayout.js
 * @brief Optimized layout for organisation details
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-07
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let LayoutView = require('../../main/views/layout');
let ScrollingMoreView = require('../../main/views/scrollingmore');
let ContentBottomFooterLayout = require('../../main/views/contentbottomfooterlayout');
let OrganisationDetailsView = require('../views/organisationdetails');
let DescriptorEditView = require('../views/descriptoredit');
let EntityListFilterView = require('../../descriptor/views/entitylistfilter');
let DescriptorCollection = require('../../descriptor/collections/layoutdescriptor');

let Layout = LayoutView.extend({
    template: require("../templates/organisationlayout.html"),

    ui: {
        establishments_tab: 'a[aria-controls=establishments]'
    },

    regions: {
        'details': "div[name=details]",
        'descriptors': "div.tab-pane[name=descriptors]",
        'establishments': 'div.tab-pane[name=establishments]'
    },

    initialize: function (options) {
        Layout.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change:layout', this.onLayoutChange, this);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onOrganisationCreate, this);
        }
    },

    onOrganisationCreate: function (model, value) {
        // re-render once created
        this.render();

        // and update history
        Backbone.history.navigate('app/organisation/organisation/' + this.model.get('id') + '/', {
            /*trigger: true,*/
            replace: false
        });
    },

    onLayoutChange: function (model, value) {
        if (value == null) {
            this.getRegion('descriptors').empty();
        } else {
            let organisationLayout = this;

            let descriptorCollection = new DescriptorCollection([], {
                model_id: value
            });

            descriptorCollection.fetch().then(function () {
                // get the layout before creating the view
                $.ajax({
                    method: "GET",
                    url: window.application.url(['descriptor', 'layout', value]),
                    dataType: 'json'
                }).done(function (data) {
                    let DescriptorView = require('../views/descriptor');
                    let descriptorView = new DescriptorView({
                        model: model,
                        layoutData: data,
                        descriptorCollection: descriptorCollection
                    });
                    organisationLayout.showChildView('descriptors', descriptorView);
                });
            });
        }
    },

    disableEstablishmentTab: function () {
        this.ui.establishments_tab.parent().addClass('disabled');
    },

    onRender: function () {
        let organisationLayout = this;

        // details view
        if (!this.model.isNew()) {
            // details view
            organisationLayout.showChildView('details', new OrganisationDetailsView({model: this.model}));

            // establishments tab
            let EstablishmentCollection = require('../collections/establishment');
            let establishments = new EstablishmentCollection([], {organisation_id: this.model.get('id')});

            // get available columns
            let columns = window.application.main.cache.lookup({
                type: 'entity_columns',
                format: {model: 'organisation.establishment'}
            });

            $.when(columns, establishments.fetch()).then(function (data) {
                if (!organisationLayout.isRendered()) {
                    return;
                }

                let EstablishmentListView = require('../views/establishmentlist');
                let establishmentListView = new EstablishmentListView({
                    collection: establishments, columns: data[0].value, model: organisationLayout.model
                });

                let contentBottomFooterLayout = new ContentBottomFooterLayout();
                organisationLayout.showChildView('establishments', contentBottomFooterLayout);

                contentBottomFooterLayout.showChildView('content', establishmentListView);
                contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({
                    collection: establishments,
                    targetView: establishmentListView
                }));

                contentBottomFooterLayout.showChildView('footer', new EntityListFilterView({
                    collection: establishments, columns: data[0].value
                }));
            });

            // if necessary enable tabs
            this.ui.establishments_tab.parent().removeClass('disabled');
        } else {
            // details
            organisationLayout.showChildView('details', new OrganisationDetailsView({model: this.model}));

            let view = this;

            let descriptorCollection = new DescriptorCollection([], {
                model_id: view.model.get('layout')
            });

            descriptorCollection.fetch().then(function () {
                // descriptors edit tab
                $.ajax({
                    method: "GET",
                    url: window.application.url(['descriptor', 'layout', view.model.get('layout')]),
                    dataType: 'json'
                }).done(function (data) {
                    let descriptorView = new DescriptorEditView({
                        model: organisationLayout.model,
                        layoutData: data,
                        descriptorCollection: descriptorCollection
                    });

                    organisationLayout.showChildView('descriptors', descriptorView);
                });

                // not available tabs
                view.disableEstablishmentTab();
            });

        }
    }
});

module.exports = Layout;
