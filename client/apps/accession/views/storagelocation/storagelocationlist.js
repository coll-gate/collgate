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
        this.ui.tree.fancytree({
            extensions: ["glyph"],
            glyph: {
                // The preset defines defaults for all supported icon types.
                preset: "bootstrap3",
                // preset: "awesome4",
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
                        source.push({
                            title: storageLocation.label,
                            key: storageLocation.id,
                            folder: true,
                            lazy: true,
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
    }

});

module.exports = View;
