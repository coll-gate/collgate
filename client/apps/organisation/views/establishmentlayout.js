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
        persons_tab: 'a[aria-controls=persons]',
        comments_tab: 'a[aria-controls=comments]',
    },

    regions: {
        'details': "div[name=details]",
        'descriptors': "div.tab-pane[name=descriptors]",
        'conservatories': 'div.tab-pane[name=conservatories]',
        'persons': "div.tab-pane[name=persons]",
        'comments': "div.tab-pane[name=comments]"
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

    disableCommentsTab: function () {
        this.ui.comments_tab.parent().addClass('disabled');
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

            // conservatories tab (@todo how to list storage because medhi put them into accession module)
            let ConservatoryCollection = require('../collections/conservatory');
            let conservatories = new ConservatoryCollection([], {establishment_id: this.model.get('id')});

            // get available columns
            let columns1 = window.application.main.cache.lookup({
                type: 'entity_columns',
                format: {model: 'organisation.conservatory'}
            });

            $.when(columns1, conservatories.fetch()).then(function (data) {
                let ConservatoryListView = require('./conservatorylist');
                let conservatoryListView  = new ConservatoryListView({
                    collection: conservatories,
                    columns: data[0].value,
                    model: establishmentLayout.model});

                let contentBottomFooterLayout = new ContentBottomFooterLayout();
                establishmentLayout.showChildView('conservatories', contentBottomFooterLayout);

                contentBottomFooterLayout.showChildView('content', conservatoryListView);
                contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({
                    collection: conservatories,
                    targetView: conservatoryListView
                }));

                let EntityListFilterView = require('../../descriptor/views/entitylistfilter');
                contentBottomFooterLayout.showChildView('footer', new EntityListFilterView({
                    collection: conservatories,
                    columns: data[0].value
                }));
            });

            // person/contact tab
            let PersonCollection = require('../collections/person');
            let persons = new PersonCollection([], {establishment_id: this.model.get('id')});

            // get available columns
            window.application.main.cache.lookup({
                type: 'entity_columns',
                format: {model: 'organisation.person'}
            }).then(function (data) {
                if (!establishmentLayout.isRendered()) {
                    return;
                }

                let PersonListView = require('../views/personlist');
                let personListView = new PersonListView({
                    collection: persons,
                    columns: data[0].value,
                    model: establishmentLayout.model
                });

                let contentBottomFooterLayout = new ContentBottomFooterLayout();
                establishmentLayout.showChildView('persons', contentBottomFooterLayout);

                contentBottomFooterLayout.showChildView('content', personListView);
                contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({
                    collection: persons,
                    targetView: personListView
                }));


                let EntityListFilterView = require('../../descriptor/views/entitylistfilter');
                contentBottomFooterLayout.showChildView('footer', new EntityListFilterView({
                    collection: persons,
                    columns: data[0].value
                }));
            });

            // comments
            let CommentListView = require('../../descriptor/views/commentlist');

            // classifications entry tab (query on show tab)
            let CommentCollection = require('../../descriptor/collections/comment');
            let comments = new CommentCollection([], {entity: this.model});

            let commentListView = new CommentListView({entity: this.model, collection: comments});
            establishmentLayout.showChildView('comments', commentListView);

            // if necessary enable tabs
            this.ui.conservatories_tab.parent().removeClass('disabled');
            this.ui.persons_tab.parent().removeClass('disabled');
            this.ui.comments_tab.parent().removeClass('disabled');
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
            this.disableCommentsTab();
        }
    }
});

module.exports = Layout;
