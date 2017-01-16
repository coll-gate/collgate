/**
 * @file accessionlayout.js
 * @brief Optimized layout for accession details
 * @author Frederic SCHERMA
 * @date 2017-01-16
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var Layout = Marionette.LayoutView.extend({
    template: require("../templates/accessionlayout.html"),

    ui: {
        synonyms_tab: 'a[href=#accession_synonyms]',
        batches_tab: 'a[href=#accession_batches]'
    },

    regions: {
        'details': "#accession_details",
        'descriptors': "#accession_descriptors",
        'synonyms': "#accession_synonyms",
        'batches-content': "#accession_batches > div.batches-content",
        'batches-bottom': "#accession_batches > div.batches-bottom"
    },

    disableSynonymsTab: function () {
        this.ui.synonyms_tab.prop('disabled', true).parent().addClass('disabled');
    },

    disableBatchesTab: function () {
        this.ui.batches_tab.prop('disabled', true).parent().addClass('disabled');;
    }
});

module.exports = Layout;
