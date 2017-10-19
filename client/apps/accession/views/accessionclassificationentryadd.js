/**
 * @file accessionclassificationentryadd.js
 * @brief Add a classification entry to an accession.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-26
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    className: 'classification-entry-add',
    template: require('../templates/accessionclassificationentryadd.html'),

    ui: {
        add_btn: 'span.add-classification-entry',
        add_entity_group: 'div.classification-entry-group'
    },

    events: {
        'click @ui.add_btn': 'addClassificationEntry'
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    onBeforeDestroy: function() {
        if (this.classificationEntryWidget) {
            this.classificationEntryWidget.destroy();
            delete this.classificationEntryWidget;
        }
    },

    onRender: function() {
        this.classificationEntryWidget = application.descriptor.widgets.newElement('entity');
        this.classificationEntryWidget.create(
            {model: 'classification.classificationentry'},
            this.ui.add_entity_group,
            false,
            0, 0);
    },

    addClassificationEntry: function () {
        let self = this;

        let classificationEntryId = this.classificationEntryWidget.values();
        this.classificationEntryWidget.clear();

        $.ajax({
            type: "PATCH",
            url: this.collection.url(),
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({
                action: 'add',
                target: 'classification_entry',
                classification_entry: classificationEntryId
            })
        }).done(function(data) {
           $.alert.success(_t("Done"));
           self.collection.fetch({reset: true});
        });
    }
});

module.exports = View;
