/**
 * @file classification.js
 * @brief Classification specialization for descriptor layout type.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescriptorMetaModelType = require('../../descriptor/descriptormetamodeltypes/descriptormetamodeltype');

let ClassificationEntry = DescriptorMetaModelType.extend({
    template: require('../templates/descriptormetamodeltypes/classificationentry.html'),

    ui: {
        'classification': 'select.classification'
    },

    onRender: function() {
        let select = this.ui.classification;

        // classifications list according to the related meta model of accession
        let ClassificationCollection = require('../collections/classification');
        let classificationCollection = new ClassificationCollection();

        let SelectOption = require('../../main/renderers/selectoption');
        let classifications = new SelectOption({
            className: "classification",
            collection: classificationCollection
        });

        let value = Object.resolve('data.classification', this.model.get('parameters'));

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
