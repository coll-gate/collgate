/**
 * @file taxonlayout.js
 * @brief Optimized layout for taxon details
 * @author Frederic SCHERMA
 * @date 2016-12-27
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var Layout = Marionette.LayoutView.extend({
    template: require("../templates/taxonlayout.html"),
    attributes: {
    },

    regions: {
        'details': "#taxon_details",
        'synonyms': "#taxon_synonyms",
        'descriptors': "#taxon_descriptors",
        'children-content': "#taxon_children > div.content",
        'children-bottom': "#taxon_children > div.bottom",
        'entities-content': "#taxon_entities > div.content",
        'entities-bottom': "#taxon_entities > div.bottom"
    }
});

module.exports = Layout;
