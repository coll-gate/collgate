/**
 * @file establishmentlayout.js
 * @brief Optimized layout for establishment details
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-04-02
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let LayoutView = require('../../main/views/layout');
let EstablishmentDetailsView = require('../views/establishmentdetails');
let DescriptorEditView = require('../views/descriptoredit');
let OrganisationModel = require('../models/organisation');
let DescriptorCollection = require('../../descriptor/collections/layoutdescriptor');

let Layout = LayoutView.extend({
    template: require("../templates/establishmentlayout.html"),

    ui: {
        conservatories_tab: 'a[aria-controls=conservatories]',
        contacts_tab: 'a[aria-controls=contacts]'
    },

    regions: {
        'details': "div[name=details]",
        'descriptors': "div.tab-pane[name=descriptors]",
        'conservatories': 'div.tab-pane[name=conservatories]',
        'contacts': "div.tab-pane[name=contacts]"
    },

    initialize: function(options) {
        Layout.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change:layout', this.onLayoutChange, this);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onEstablishmentCreate, this);
        }
    },

    onEstablishmentCreate: function(model, value) {
        // re-render once created
        this.render();

        // and update history
        Backbone.history.navigate('app/organisation/establishment/' + this.model.get('id') + '/', {/*trigger: true,*/ replace: false});
    },

    onLayoutChange: function(model, value) {
        if (value == null) {
            this.getRegion('descriptors').empty();
        } else {
            let establishmentLayout = this;

            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: window.application.url(['descriptor', 'layout', value]),
                dataType: 'json'
            }).done(function (data) {

                let descriptorCollection = new DescriptorCollection([], {
                    model_id: data.id
                });

                descriptorCollection.fetch().then(function () {
                    let DescriptorView = require('../views/descriptor');
                    let descriptorView = new DescriptorView({
                        model: model,
                        layoutData: data,
                        descriptorCollection: descriptorCollection
                    });
                    establishmentLayout.showChildView('descriptors', descriptorView);

                });
            });
        }
    },

    disableConservatoriesTab: function () {
        this.ui.conservatories_tab.parent().addClass('disabled');
    },

    disableContactsTab: function () {
        this.ui.contacts_tab.parent().addClass('disabled');
    },

    onRender: function() {
        let establishmentLayout = this;

        // details view
        if (!this.model.isNew()) {
            // organisation parent
            let organisation = new OrganisationModel({id: this.model.get('organisation')});
            organisation.fetch().then(function () {
                establishmentLayout.showChildView('details', new EstablishmentDetailsView({
                    model: establishmentLayout.model,
                    organisation: organisation
                }));
            });

            /*// conservatories tab
            let ConservatoriesCollection = require('../collections/conservatories');
            let conservatories = new ConservatoriesCollection([], {establishment_id: this.model.get('id')});

            conservatories.fetch().then(function() {
                let EstablishmentListView = require('../views/establishmentlist');
                let establishmentListView  = new EstablishmentListView({collection: establishments, model: organisationLayout.model});

                let contentBottomFooterLayout = new ContentBottomFooterLayout();
                organisationLayout.showChildView('establishments', contentBottomFooterLayout);

                contentBottomFooterLayout.showChildView('content', establishmentListView);
                contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({targetView: establishmentListView}));

                let EstablishmentListFilterView = require('./establishmentlistfilter');
                contentBottomFooterLayout.showChildView('footer', new EstablishmentListFilterView({
                    organisation: organisationLayout.model,
                    collection: establishments
                }));

                // @todo contacts
            });*/

            // if necessary enable tabs
            this.ui.conservatories_tab.parent().removeClass('disabled');
            this.ui.contacts_tab.parent().removeClass('disabled');
        } else {
            // organisation parent
            let organisation = new OrganisationModel({id: this.model.get('organisation')});
            organisation.fetch().then(function () {
                establishmentLayout.showChildView('details', new EstablishmentDetailsView({
                    model: establishmentLayout.model,
                    organisation: organisation,
                    noLink: true
                }));
            });

            // descriptors edit tab
            $.ajax({
                method: "GET",
                url: window.application.url(['descriptor', 'layout', this.model.get('layout')]),
                dataType: 'json'
            }).done(function(data) {

                let descriptorCollection = new DescriptorCollection([], {
                    model_id: data.id
                });

                descriptorCollection.fetch().then(function () {
                    let descriptorView = new DescriptorEditView({
                        model: establishmentLayout.model,
                        layoutData: data,
                        descriptorCollection: descriptorCollection
                    });
                    establishmentLayout.showChildView('descriptors', descriptorView);
                });
            });

            // not available tabs
            this.disableConservatoriesTab();
            this.disableContactsTab();
        }
    }
});

module.exports = Layout;
