/**
 * @file accession.js
 * @brief Accession specialization for descriptor meta-model type.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var DescriptorMetaModelType = require('../../descriptor/descriptormetamodeltypes/descriptormetamodeltype');

var Accession = DescriptorMetaModelType.extend({
    className: 'descriptor-meta-model-type-details-data',
    template: require('../templates/descriptormetamodeltypes/accession.html'),

    ui: {
        'primary_classification': '#primary_classification',
        'batch_descriptor_meta_models': '#batch_descriptor_meta_models'
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        var primaryClassification = this.ui.primary_classification;

        // classifications list according to the related meta model of accession
        var ClassificationCollection = require('../../classification/collections/classification');
        var classificationCollection = new ClassificationCollection();

        var SelectOption = require('../../main/renderers/selectoption');
        var classifications = new SelectOption({
            className: "classification",
            collection: classificationCollection
        });

        var primaryClassificationValue = this.model.get('parameters')['data']['primary_classification'];

        classifications.drawSelect(primaryClassification, true, false, primaryClassificationValue).done(function () {
        });

        // @todo batch list
    },

    getData: function() {
        return {
            'primary_classification': parseInt(this.ui.primary_classification.val()),
            'batch_descriptor_meta_models': [19]  // @todo
        }
    }
});

Accession.descriptorMetaModelTarget = 'accession.accession';

module.exports = Accession;
