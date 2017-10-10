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
var ContentBottomFooterLayout = require('../../main/views/contentbottomfooterlayout');
var ScrollingMoreView = require('../../main/views/scrollingmore');
var EntityListFilterView = require('../../descriptor/views/entitylistfilter');

var Layout = LayoutView.extend({
    template: require("../templates/panellayout.html"),
    templateContext: function () {
        return {
            acc_amount: this.model.get('accessions_amount')
        }
    },

    ui: {
        accessions_tab: 'a[aria-controls=accessions]',
        accessions_badge: '#accessions-badge'
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
        Backbone.history.navigate('app/accession/accessions_panel/' + this.model.get('id') + '/', {
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

            panelLayout.showChildView('descriptors', accessionPanelDescriptorCreateView);

            if (panelLayout.initialTab === 'descriptors') {
                accessionPanelDescriptorCreateView.onShowTab();
            }

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

                if (panelLayout.initialTab === 'descriptors') {
                    panelDescriptorView.onShowTab();
                }
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


        var columns = application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'accession.accession'}
        });

        columns.done(function (data) {
            if (!panelLayout.isRendered()) {
                return;
            }

            var AccessionListView = require('../views/panelaccessionlist');
            var accessionListView = new AccessionListView({
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

            var contentBottomFooterLayout = new ContentBottomFooterLayout();
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

        this.onDescriptorMetaModelChange(this.model, this.model.get('descriptor_meta_model'));
        this.enableTabs();
    }
});

module.exports = Layout;
