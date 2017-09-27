/**
 * @file accessionclassificationentry.js
 * @brief Accession classification entry item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-26
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var ClassificationEntryView = require('../../classification/views/classificationentry');

var View = ClassificationEntryView.extend({
    initialize: function () {
        View.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change', this.render, this);
    },

    onRemoveClassificationEntry: function() {
        // @todo
        alert("@todo")
        // this.model.destroy({wait: true}).then(function() {
        //     $.alert.success(_t("Successfully removed !"));
        // });
    },
});

module.exports = View;
