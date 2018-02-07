/**
 * @file panellayout.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-09-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let LayoutView = require('../../../../main/views/layout');
let ContentBottomFooterLayout = require('../../../../main/views/contentbottomfooterlayout');
let ScrollingMoreView = require('../../../../main/views/scrollingmore');
let EntityListFilterView = require('../../../../descriptor/views/entitylistfilter');

let Layout = LayoutView.extend({
    template: require("../../../templates/accessionpanellayout.html"),
    templateContext: function () {
        return {
            acc_amount: this.model.get('accessions_amount')
        }
    },

    ui: {
        inputs_tab: 'a[aria-controls=accessions]',
        accessions_badge: '#accessions-badge'
    },

    regions: {
        'descriptors': "div.tab-pane[name=descriptors]",
        'accessions': "div.tab-pane[name=accessions]"
    },

    initialize: function (options) {
        Layout.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change:layout', this.onLayoutChange, this);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onPanelCreate, this);
        }
    },

    onPanelCreate: function (model, value) {
        // re-render once created
        this.render();

        // and update history
        Backbone.history.navigate('app/accession/accessionpanel/' + this.model.get('id') + '/', {
            /*trigger: true,*/
            replace: false
        });
    },

    updateAccessionsAmount: function (nb) {
        this.ui.accessions_badge.html(nb);
        // this.childView('bottom').onUpdateCount(nb)
        // this.render()
    },

    disableEntitiesTab: function () {
        this.ui.inputs_tab.parent().addClass('disabled');
    },

    enableTabs: function () {
        this.ui.inputs_tab.parent().removeClass('disabled');
    },

    onLayoutChange: function (model, value) {
        let panelLayout = this;
        if (value == null) {
            let AccessionPanelDescriptorCreateView = require('./paneldescriptorcreate');
            let accessionPanelDescriptorCreateView = new AccessionPanelDescriptorCreateView({model: model});

            panelLayout.showChildView('descriptors', accessionPanelDescriptorCreateView);

            if (panelLayout.initialTab === 'descriptors') {
                accessionPanelDescriptorCreateView.onShowTab();
            }
        } else {
            let panelLayout = this;
            let DescriptorCollection = require('../../../../descriptor/collections/layoutdescriptor');

            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: window.application.url(['descriptor', 'layout', value]),
                dataType: 'json'
            }).done(function (data) {
                panelLayout.descriptorCollection = new DescriptorCollection([], {
                    model_id: data.id
                });
                panelLayout.descriptorCollection.fetch().then(function () {
                    if (!panelLayout.isRendered()) {
                        return;
                    }

                    let PanelDescriptorView = require('./paneldescriptor');
                    let panelDescriptorView = new PanelDescriptorView({
                        model: model,
                        layoutData: data,
                        descriptorCollection: panelLayout.descriptorCollection
                    });
                    panelLayout.showChildView('descriptors', panelDescriptorView);

                    if (panelLayout.initialTab === 'descriptors') {
                        panelDescriptorView.onShowTab();
                    }
                });
            });
        }
    },

    onRender: function () {
        let panelLayout = this;

        if (this.model.isNew()) {
            this.model.save();
        }

        // accession tab
        let AccessionCollection = require('../../../collections/accession');
        let accessionPanelAccessions = new AccessionCollection([], {panel_id: this.model.get('id')});


        let columns = application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'accession.accession'}
        });

        columns.done(function (data) {
            if (!panelLayout.isRendered()) {
                return;
            }

            let AccessionListView = require('./accessionlist');
            let accessionListView = new AccessionListView({
                collection: accessionPanelAccessions,
                model: panelLayout.model,
                columns: data[0].value,
                collectionEvents: {
                    'update': 'updateAmount'
                },
                layoutView: panelLayout,
                relatedEntity: {
                    'content_type': 'accession.accessionpanel',
                    'id': panelLayout.model.id
                }
            });

            let contentBottomFooterLayout = new ContentBottomFooterLayout();
            panelLayout.showChildView('accessions', contentBottomFooterLayout);

            contentBottomFooterLayout.showChildView('content', accessionListView);
            contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({
                collection: accessionPanelAccessions,
                targetView: accessionListView
            }));

            contentBottomFooterLayout.showChildView('footer', new EntityListFilterView({
                collection: accessionPanelAccessions,
                columns: data[0].value
            }));

            accessionListView.query();

            if (panelLayout.initialTab === 'accessions') {
                accessionListView.onShowTab();
            }
        });

        this.onLayoutChange(this.model, this.model.get('layout'));
        this.enableTabs();
    }
});

module.exports = Layout;
