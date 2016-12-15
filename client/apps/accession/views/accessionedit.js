/**
 * @file accessionedit.js
 * @brief Accession item edit view
 * @author Frederic SCHERMA
 * @date 2016-12-09
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescribableEdit = require('../../descriptor/views/describableedit');

var View = DescribableEdit.extend({
    template: require('../templates/accessionedit.html'),
    templateHelpers: function () {
        return {
            panels: this.panels,
            parent_details: []  // @todo remove
        };
    },

    ui: {
        "cancel": "button.cancel",
        "apply": "button.apply"
    },

    events: {
        "click @ui.cancel": "onCancel",
        "click @ui.apply": "onApply",
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this);
        this.panels = options.panels;
    },

    onApply: function () {
        var descriptors = this.prepareDescriptors();
        var data = {
            descriptors: descriptors
        }

        this.model.save(data, {wait: true}).done(function() {
            // redirect to accession view
            Backbone.history.navigate('app/accession/accession/' + this.get('id') + '/', {trigger: true, replace: true});
        });
    },

    onCancel: function () {
        Backbone.history.navigate('app/home/', {trigger: true, replace: true});
    }
});

module.exports = View;
