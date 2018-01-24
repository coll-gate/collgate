/**
 * @file classificationentrylayout.js
 * @brief Optimized layout for classification entry details
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let LayoutView = require('../../main/views/layout');
let ScrollingMoreView = require('../../main/views/scrollingmore');
let ContentBottomLayout = require('../../main/views/contentbottomlayout');
let ClassificationEntryDescriptorEditView = require('./classificationentrydescriptoredit');
let ClassificationEntryDetailsView = require('./classificationentrydetails');
let ClassificationEntryModel = require('../models/classificationentry');

let Layout = LayoutView.extend({
    template: require("../templates/classificationentrylayout.html"),

    ui: {
        synonyms_tab: 'a[aria-controls=synonyms]',
        children_tab: 'a[aria-controls=children]',
        entities_tab: 'a[aria-controls=entities]',
        related_tab: 'a[aria-controls=related]'
    },

    regions: {
        'details': 'div[name=details]',
        'synonyms': 'div.tab-pane[name=synonyms]',
        'descriptors': 'div.tab-pane[name=descriptors]',
        'children': 'div.tab-pane[name=children]',
        'entities': 'div.tab-pane[name=entities]',
        'related': 'div.tab-pane[name=related]'
    },

    initialize: function(options) {
        Layout.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change:descriptor_meta_model', this.onLayoutChange, this);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onClassificationEntryCreate, this);
        }
    },

    onClassificationEntryCreate: function(model, value) {
        // re-render once created
        this.render();

        // and update history
        Backbone.history.navigate('app/classification/classificationentry/' + this.model.get('id') + '/', {/*trigger: true,*/ replace: false});
    },

    disableSynonymsTab: function () {
        this.ui.synonyms_tab.parent().addClass('disabled');
    },

    disableChildrenTab: function () {
        this.ui.children_tab.parent().addClass('disabled');
    },

    disableEntitiesTab: function () {
        this.ui.entities_tab.parent().addClass('disabled');
    },

    disableRelatedTab: function () {
        this.ui.related_tab.parent().addClass('disabled');
    },

    enableTabs: function() {
        this.ui.synonyms_tab.parent().removeClass('disabled');
        this.ui.children_tab.parent().removeClass('disabled');
        this.ui.entities_tab.parent().removeClass('disabled');
        this.ui.related_tab.parent().removeClass('disabled');
    },

    onLayoutChange: function(model, value) {
        if (value === null) {
            this.getRegion('descriptors').empty();
            // let ClassificationEntryDescriptorCreateView = require('./classificationentrydescriptorcreate');
            // let classificationEntryDescriptorCreateView = new ClassificationEntryDescriptorCreateView({model: model});
            //
            // this.showChildView('descriptors', classificationEntryDescriptorCreateView);
        } else {
            let classificationEntryLayout = this;

            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: window.application.url(['descriptor', 'meta-model', value, 'layout']),
                dataType: 'json'
            }).done(function (data) {
                if (!classificationEntryLayout.isRendered()) {
                    return;
                }

                let ClassificationEntryDescriptorView = require('./classificationentrydescriptor');
                let classificationEntryDescriptorView = new ClassificationEntryDescriptorView({
                    model: model,
                    descriptorMetaModelLayout: data
                });

                classificationEntryLayout.showChildView('descriptors', classificationEntryDescriptorView);
            });
        }
    },

    onRender: function() {
        let classificationEntryLayout = this;

        // details view
        if (!this.model.isNew()) {
            // details views
            this.showChildView('details', new ClassificationEntryDetailsView({model: this.model}));

            // synonyms tab
            let ClassificationEntrySynonymsView = require('./classificationentrysynonyms');
            this.showChildView('synonyms', new ClassificationEntrySynonymsView({model: this.model}));

            // direct classification entry sub-levels tab
            let ClassificationEntryChildrenCollection = require('../collections/classificationentrychildren');
            let classificationEntryChildren = new ClassificationEntryChildrenCollection([], {
                model_id: this.model.id,
                deeply: true
            });

            // get available columns
            let columns = application.main.cache.lookup({
                type: 'entity_columns',
                format: {model: 'classification.classificationentry'}
            });

            columns.then(function(data) {
                if (!classificationEntryLayout.isRendered()) {
                    return;
                }

                let ClassificationEntryChildrenView = require('./classificationentrychildren');
                let classificationEntryChildrenView = new ClassificationEntryChildrenView({
                    collection: classificationEntryChildren,
                    model: classificationEntryLayout.model,
                    columns: data[0].value
                });

                let contentBottomLayout = new ContentBottomLayout();
                classificationEntryLayout.showChildView('children', contentBottomLayout);

                contentBottomLayout.showChildView('content', classificationEntryChildrenView);
                contentBottomLayout.showChildView('bottom', new ScrollingMoreView({
                    targetView: classificationEntryChildrenView, collection: classificationEntryChildren}));

                classificationEntryChildrenView.query();
            });

            // entities relating this classificationEntry tab
            let ClassificationEntryEntitiesCollection = require('../collections/classificationentryentities');
            let classificationEntryEntities = new ClassificationEntryEntitiesCollection([], {model_id: this.model.id});

            classificationEntryEntities.fetch().then(function () {
                if (!classificationEntryLayout.isRendered()) {
                    return;
                }

                let ClassificationEntryEntitiesView = require('./classificationentryentities');
                let classificationEntryEntitiesView = new ClassificationEntryEntitiesView({
                    collection: classificationEntryEntities, model: classificationEntryLayout.model});

                let contentBottomLayout = new ContentBottomLayout();
                classificationEntryLayout.showChildView('entities', contentBottomLayout);

                contentBottomLayout.showChildView('content', classificationEntryEntitiesView);
                contentBottomLayout.showChildView('bottom', new ScrollingMoreView({targetView: classificationEntryEntitiesView}));
            });

            // related classification entries

            let ClassificationEntryCollection = require('../collections/classificationentry');
            let classificationEntryRelated = new ClassificationEntryCollection([], {classification_entry_id: this.model.id});

            $.when(columns, classificationEntryRelated.fetch()).then(function(data) {
                if (!classificationEntryLayout.isRendered()) {
                    return;
                }

                let ClassificationEntryListView = require('./classificationentrylist');
                let classificationEntryListView = new ClassificationEntryListView({
                    // classification_entry: classification,
                    collection: classificationEntryRelated,
                    columns: data[0].value
                });

                let contentBottomLayout = new ContentBottomLayout();
                classificationEntryLayout.showChildView('related', contentBottomLayout);

                contentBottomLayout.showChildView('content', classificationEntryListView);
                contentBottomLayout.showChildView('bottom', new ScrollingMoreView({
                    targetView: classificationEntryListView, collection: classificationEntryRelated}));
            });

            this.onLayoutChange(this.model, this.model.get('descriptor_meta_model'));
            this.enableTabs();
        } else {
            // details views
            if (this.model.get('parent') && !this.model.get('parent_details').length) {
                // query parent details
                let parentClassificationEntry = new ClassificationEntryModel({id: this.model.get('parent')});
                parentClassificationEntry.fetch().then(function () {
                    if (!classificationEntryLayout.isRendered()) {
                       return;
                    }

                    let parentDetails = [];

                    parentDetails.push({
                        id: parentClassificationEntry.get('id'),
                        name: parentClassificationEntry.get('name'),
                        rank: parentClassificationEntry.get('rank'),
                        parent: parentClassificationEntry.get('parent')
                    });

                    parentDetails.push.apply(parentDetails, parentClassificationEntry.get('parent_details'));
                    classificationEntryLayout.model.set('parent_details', parentDetails);

                    classificationEntryLayout.showChildView('details', new ClassificationEntryDetailsView({
                        model: classificationEntryLayout.model, noLink: true}));
                });
            } else {
                // parent details provided
                this.showChildView('details', new ClassificationEntryDetailsView({model: this.model, noLink: true}));
            }

            // descriptors edit tab
            $.ajax({
                method: "GET",
                url: window.application.url(['descriptor', 'meta-model', this.model.get('descriptor_meta_model'), 'layout']),
                dataType: 'json'
            }).done(function(data) {
                if (!classificationEntryLayout.isRendered()) {
                    return;
                }

                let classificationEntryDescriptorView = new ClassificationEntryDescriptorEditView({
                    model: classificationEntryLayout.model, descriptorMetaModelLayout: data});

                classificationEntryLayout.showChildView('descriptors', classificationEntryDescriptorView);
            });

            this.setActiveTab("descriptors");

            this.disableSynonymsTab();
            this.disableChildrenTab();
            this.disableEntitiesTab();
            this.disableRelatedTab();
        }
    },

    // onDomRefresh: function() {
    //     No longer useful
    //     descriptors tab (on this event because of the child event not fired otherwise)
    //     let ClassificationEntryDescriptorCreateView = require('../views/classificationentrydescriptorcreate');
    //     let classificationEntryDescriptorCreateView = new ClassificationEntryDescriptorCreateView({model: this.model});
    //     this.showChildView('descriptors', classificationEntryDescriptorCreateView);
    // }
});

module.exports = Layout;
