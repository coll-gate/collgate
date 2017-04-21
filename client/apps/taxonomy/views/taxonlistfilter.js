/**
 * @file taxonlistfilter.js
 * @brief Filter the list of taxon
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-03
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'taxon-filter',
    template: require('../templates/taxonlistfilter.html'),

    ui: {
        filter_btn: 'button.taxon-filter',
        taxon_rank: 'select.taxon-rank',
        taxon_name: 'input.taxon-name'
    },

    events: {
        'click @ui.filter_btn': 'onFilter',
        'input @ui.taxon_name': 'onTaxonNameInput'
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    onRender: function() {
        application.taxonomy.views.taxonRanks.drawSelect(this.ui.taxon_rank, true, true);
    },

    onFilter: function () {
        if (this.validateTaxonName()) {
            this.collection.filters = {
                name: this.ui.taxon_name.val().trim(),
                rank: $(this.ui.taxon_rank).val(),
                method: "icontains"
            };

            this.collection.fetch({reset: true});
        }
    },

    validateTaxonName: function() {
        var v = this.ui.taxon_name.val().trim();

        if (v.length > 0 && v.length < 3) {
            $(this.ui.taxon_name).validateField('failed', gt.gettext('3 characters min'));
            return false;
        } else if (this.ui.taxon_name.val().length == 0) {
            $(this.ui.taxon_name).cleanField();
            return true;
        } else {
            $(this.ui.taxon_name).validateField('ok');
            return true;
        }
    },

    onTaxonNameInput: function () {
        return this.validateTaxonName();
    }
});

module.exports = View;

