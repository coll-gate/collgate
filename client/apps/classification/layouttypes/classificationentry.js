/**
 * @file classification.js
 * @brief Classification specialization for descriptor layout type.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let LayoutType = require('../../descriptor/layouttypes/layouttype');

let ClassificationEntry = LayoutType.extend({
    template: require('../templates/layouttypes/classificationentry.html'),

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

        classifications.drawSelect(select, true, true, value).done(function () {
        });
    },

    getData: function() {
        return {
            'classification': parseInt(this.ui.classification.val())
        }
    }
});

ClassificationEntry.layoutTarget = 'classification.classificationentry';

module.exports = ClassificationEntry;
