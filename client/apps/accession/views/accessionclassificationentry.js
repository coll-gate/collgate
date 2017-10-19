/**
 * @file accessionclassificationentry.js
 * @brief Accession classification entry item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-26
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ClassificationEntryView = require('../../classification/views/classificationentry');

let View = ClassificationEntryView.extend({
    initialize: function () {
        View.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change', this.render, this);
    },

    onRemoveClassificationEntry: function() {
        let self = this;

        $.ajax({
            type: "PATCH",
            url: this.model.collection.url(),
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({
                action: 'remove',
                target: 'classification_entry',
                classification_entry: this.model.get('id')
            })
        }).done(function(data) {
           $.alert.success(_t("Successfully removed !"));
           self.model.collection.fetch({reset: true});
        });
    },
});

module.exports = View;
