/**
 * @file accessionedit.js
 * @brief Accession entity item edit view
 * @author Frederic SCHERMA
 * @date 2016-16-15
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var DescribableEdit = require('../../descriptor/views/describableedit');

var View = DescribableEdit.extend({
    onApply: function () {
        var descriptors = this.prepareDescriptors();
        console.log(descriptors);

        return;

        this.model.save({descriptors: descriptors}, {wait: true}).then(function() {
            alert("todo");
        });
    }
});

module.exports = View;
