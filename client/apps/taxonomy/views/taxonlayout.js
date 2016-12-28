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
        style: "display: flex; flex-direction: column;"
    },

    regions: {
        'details': "#taxon_details",
        'synonyms': "#taxon_synonyms",
        'descriptors': "#taxon_descriptors",
        'children-content': "#taxon_children > div.children-content",
        'children-bottom': "#taxon_children > div.children-bottom",
        'entities-content': "#taxon_entities > div.entities-content",
        'entities-bottom': "#taxon_entities > div.entities-bottom"
    }
});

module.exports = Layout;
