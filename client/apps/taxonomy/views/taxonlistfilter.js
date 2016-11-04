/**
 * @file taxonfilterlist.js
 * @brief Filter the list of taxon
 * @author Frederic SCHERMA
 * @date 2016-10-03
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
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
        taxon_name: 'input.taxon-name',
    },

    events: {
        'click @ui.filter_btn': 'onFilter',
        'input @ui.taxon_name': 'onTaxonNameInput',
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
                name: this.ui.taxon_name.val(),
                rank: $(this.ui.taxon_rank).val(),
                method: "icontains"
            }

            this.collection.fetch({reset: true});
        }
    },

    validateTaxonName: function() {
        var v = this.ui.taxon_name.val();
        var re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.taxon_name).validateField('failed', gt.gettext("Invalid characters (alphanumeric, _ and - only)"));
            return false;
        } else if (v.length > 0 && v.length < 3) {
            $(this.ui.taxon_name).validateField('failed', gt.gettext('3 characters min'));
            return false;
        } else if (v.length == 0) {
            $(this.ui.taxon_name).cleanField();
            return true;
        } else {
            $(this.ui.taxon_name).validateField('ok');
            return true;
        }
    },

    onTaxonNameInput: function () {
        this.validateTaxonName();
    },
});

module.exports = View;
