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
let ContentBottomFooterLayout = require('../../main/views/contentbottomfooterlayout');
let EstablishmentDetailsView = require('../views/establishmentdetails');
let DescriptorEditView = require('../views/descriptoredit');
let OrganisationModel = require('../models/organisation');
let DescriptorCollection = require('../../descriptor/collections/layoutdescriptor');
let ScrollingMoreView = require('../../main/views/scrollingmore');

let Layout = LayoutView.extend({
    template: require("../templates/establishmentlayout.html"),

    ui: {
        conservatories_tab: 'a[aria-controls=conservatories]',
        persons_tab: 'a[aria-controls=persons]'
    },

    regions: {
        'details': "div[name=details]",
        'descriptors': "div.tab-pane[name=descriptors]",
        'conservatories': 'div.tab-pane[name=conservatories]',
        'persons': "div.tab-pane[name=persons]"
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
        this.ui.persons_tab.parent().addClass('disabled');
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

            /*// conservatories tab (@todo put 'storage' into accession module is this correct ?)
            let StorageCollection = require('../collections/storage');
            let storages = new StorageCollection([], {establishment_id: this.model.get('id')});

            storages.fetch().then(function() {
                let StorageListView = require('../views/storagelist');
                let storageListView  = new StorageListView({collection: storage, model: establishmentLayout.model});

                let contentBottomFooterLayout = new ContentBottomFooterLayout();
                establishmentLayout.showChildView('storage', contentBottomFooterLayout);

                contentBottomFooterLayout.showChildView('content', storageListView);
                contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({targetView: storageListView}));

                let StorageListFilterView = require('./storagelistfilter');
                contentBottomFooterLayout.showChildView('footer', new StorageListFilterView({
                    establishment: establishmentLayout.model,
                    collection: storages
                }));
            });*/

            // person/contact tab
            let PersonCollection = require('../collections/person');
            let persons = new PersonCollection([], {establishment_id: this.model.get('id')});

            // get available columns
            let columns = window.application.main.cache.lookup({
                type: 'entity_columns',
                format: {model: 'organisation.person'}
            });

            $.when(columns, persons.fetch()).then(function (data) {
                if (!establishmentLayout.isRendered()) {
                    return;
                }

                let PersonListView = require('../views/personlist');
                let personListView = new PersonListView({
                    collection: persons, columns: data[0].value, model: establishmentLayout.model
                });

                let contentBottomFooterLayout = new ContentBottomFooterLayout();
                establishmentLayout.showChildView('persons', contentBottomFooterLayout);

                contentBottomFooterLayout.showChildView('content', personListView);
                contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({
                    collection: persons,
                    targetView: personListView
                }));

                contentBottomFooterLayout.showChildView('footer', new EntityListFilterView({
                    collection: persons, columns: data[0].value
                }));
            });

            // if necessary enable tabs
            this.ui.conservatories_tab.parent().removeClass('disabled');
            this.ui.persons_tab.parent().removeClass('disabled');
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
