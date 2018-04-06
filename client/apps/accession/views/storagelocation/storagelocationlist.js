/**
 * @file storagelocationlist.js
 * @brief storage locations overview
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-03-29
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    template: require('../../templates/storagelocation/storagelocation.html'),

    ui: {
        tree: '#tree'
    },

    onRender: function () {

        this.onShowTab();

        this.ui.tree.fancytree({
            extensions: ["glyph"],
            glyph: {
                // The preset defines defaults for all supported icon types.
                // preset: "bootstrap3",
                preset: "awesome4",
                map: {
                    folder: 'fa-archive',
                    doc: 'fa-archive',
                    folderOpen: 'fa-archive fa-border fa-rotate-180 fa-flip-horizontal',
                    loading: "fa-spinner fa-pulse",
                    error: "fa-warning",
                    expanderClosed: "fa-chevron-right",
                    expanderLazy: "fa-chevron-right",
                    expanderOpen: "fa-chevron-down",
                }
            },
            source: {
                url: window.application.url(['accession', 'storagelocation'])
            },
            lazyLoad: function (event, data) {
                let node = data.node;
                // Load child nodes via Ajax GET .../accession/storagelocation?parent=[PARENT.ID]
                data.result = {
                    url: window.application.url(['accession', 'storagelocation']),
                    data: {parent: node.key},
                    cache: false
                };
            },
            postProcess: function (event, data) {
                let orgResponse = data.response;

                if (orgResponse.items) {
                    let source = [];
                    _.each(orgResponse.items, function (storageLocation) {
                        let hasChildren = storageLocation.children_count > 0;
                        source.push({
                            title: storageLocation.label,
                            key: storageLocation.id,
                            folder: hasChildren,
                            lazy: hasChildren
                        })
                    });

                    data.result = source;

                } else {
                    // Signal error condition to tree loader
                    data.result = {
                        error: "ERROR #" + orgResponse.faultCode + ": " + orgResponse.faultMsg
                    }
                }
            },
            escapeTitles: true,
            strings: {
                loading: _t("Loading..."),
                loadError: _t("Load error!"),
                moreData: _t("More..."),
                noData: _t("No data.")
            }

        });
    },

    onShowTab: function () {
        let self = this;

        let contextLayout = window.application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            window.application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({
            title: _t("Storage location actions"),
            glyphicon: 'fa-wrench'
        }));

        let actions = [
            'create-storageLocation',
        ];

        let StorageLocationListContextView = require('./storagelocationlistcontext');
        let contextView = new StorageLocationListContextView({
            actions: actions,
            advancedTable: self,
        });

        contextLayout.showChildView('content', contextView);

        contextView.on("storageLocation:create", function () {
            self.onCreatestorageLocation();
        });
    },

    onCreatestorageLocation: function () {
        window.application.accession.controllers.storagelocation.create();
    },

    onBeforeDetach: function () {
        window.application.main.defaultRightView();
    },

    onHideTab: function () {
        window.application.main.defaultRightView();
    },

});

module.exports = View;
