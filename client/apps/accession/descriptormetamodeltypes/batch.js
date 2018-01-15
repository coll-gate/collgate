/**
 * @file batch.js
 * @brief Batch specialization for descriptor meta-model type.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescriptorMetaModelType = require('../../descriptor/descriptormetamodeltypes/descriptormetamodeltype');

let Batch = DescriptorMetaModelType.extend({
    template: require('../templates/descriptormetamodeltypes/batch.html'),

    regions: {
        "namingOptions": "div.accession-naming-options"
    },

    onRender: function() {
        // naming options
        let self = this;

        let namingOptions = Object.resolve('data.naming_options', this.model.get('parameters')) || [];

        $.ajax({
            type: "GET",
            url: window.application.url(['accession', 'naming', 'batch']),
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

    getData: function() {
        return {
            'naming_options': this.getChildView("namingOptions").getNamingOptions()
        }
    }
});

Batch.descriptorMetaModelTarget = 'accession.batch';

module.exports = Batch;
