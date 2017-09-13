/**
 * @file classification.js
 * @brief Classification specialization for descriptor meta-model type.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var DescriptorMetaModelType = require('../../descriptor/descriptormetamodeltypes/descriptormetamodeltype');

var ClassificationEntry = DescriptorMetaModelType.extend({
    className: 'descriptor-meta-model-type-details-data',
    template: require('../templates/descriptormetamodeltypes/classificationentry.html'),

    ui: {
        'classification': '#classification'
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        var select = this.ui.classification;

        // classifications list according to the related meta model of accession
        var ClassificationCollection = require('../collections/classification');
        var classificationCollection = new ClassificationCollection();

        var SelectOption = require('../../main/renderers/selectoption');
        var classifications = new SelectOption({
            className: "classification",
            collection: classificationCollection
        });

        var value = this.model.get('parameters')['data']['classification'];

        classifications.drawSelect(select, true, false, value).done(function () {
        });
    },

    getData: function() {
        return {
            'classification': parseInt(this.ui.classification.val())
        }
    }
});

ClassificationEntry.descriptorMetaModelTarget = 'classification.classificationentry';

module.exports = ClassificationEntry;
