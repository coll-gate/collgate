/**
 * @file accession.js
 * @brief Accession specialization for descriptor layout type.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescriptorMetaModelType = require('../../descriptor/descriptormetamodeltypes/descriptormetamodeltype');

let Accession = DescriptorMetaModelType.extend({
    template: require('../templates/descriptormetamodeltypes/accession.html'),

    regions: {
        "namingOptions": "div.accession-naming-options"
    },

    ui: {
        'primary_classification': 'select.primary-classification',
        'batch_layouts_group': 'div.batch-descriptor-meta-models-group'
    },

    onRender: function () {
        let primaryClassification = this.ui.primary_classification;

        // classifications list according to the related meta model of accession
        let ClassificationCollection = require('../../classification/collections/classification');
        let classificationCollection = new ClassificationCollection();

        let SelectOption = require('../../main/renderers/selectoption');
        let classifications = new SelectOption({
            className: "classification",
            collection: classificationCollection
        });

        let primaryClassificationValue = Object.resolve('data.primary_classification', this.model.get('parameters'));

        classifications.drawSelect(primaryClassification, true, true, primaryClassificationValue).done(function () {
        });

        // batches list
        let batchesListValues = Object.resolve('data.batch_layouts', this.model.get('parameters')) || [];

        this.batchesWidget = window.application.descriptor.widgets.newElement('layout');
        this.batchesWidget.create(
            {model: 'accession.batch'},
            this.ui.batch_layouts_group, {
                readOnly: false,
                multiple: true
            });

        if (batchesListValues.length) {
            this.batchesWidget.set({model: 'accession.batch'}, true, batchesListValues);
        }

        // naming options
        let self = this;

        let namingOptions = Object.resolve('data.naming_options', this.model.get('parameters')) || [];

        $.ajax({
            type: "GET",
            url: window.application.url(['accession', 'naming', 'accession']),
            dataType: 'json',
        }).done(function(data) {
            let NamingOptionsView = require('../views/namingoption');
            let len = (data.format.match(/{CONST}/g) || []).length;

            if (namingOptions.length !== len) {
                namingOptions = new Array(len);
            }

            self.showChildView("namingOptions", new NamingOptionsView({
                namingFormat: data.format,
                namingOptions: namingOptions
            }));
        });
    },

    getData: function () {
        return {
            'primary_classification': parseInt(this.ui.primary_classification.val()),
            'naming_options': this.getChildView("namingOptions").getNamingOptions(),
            'batch_layouts': this.batchesWidget.values() || []
        }
    },

    onBeforeDestroy: function () {
        if (this.batchesWidget) {
            this.batchesWidget.destroy();
            delete this.batchesWidget;
        }
    }
});

Accession.descriptorMetaModelTarget = 'accession.accession';

module.exports = Accession;
