/**
 * @file accessionlistfooter.js
 * @brief Filter and configuration for the list of accession
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-22
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'accession-footer',
    template: require('../templates/accessionlistfooter.html'),

    ui: {
        filter_btn: 'button.accession-filter',
        accession_name: 'input.accession-name',
        accession_advanced_search: 'button.accession-advanced-search'
    },

    events: {
        'click @ui.filter_btn': 'onFilter',
        'input @ui.accession_name': 'onAccessionNameInput',
        'click @ui.accession_advanced_search': 'onAdvancedSearch'
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    onRender: function() {
    },

    onFilter: function () {
        if (this.validateAccessionName()) {
            this.collection.filters = [{
                type: 'term',
                field: 'name',
                value: this.ui.accession_name.val().trim(),
                op: "icontains"
            }];
            //
            // this.collection.filters = [{
            //     type: 'term',
            //     field: 'name',
            //     value: this.ui.accession_name.val().trim(),
            //     op: "icontains"
            // }, {
            //     type: 'op',
            //     value: 'and'
            // }, [{
            //     type: 'term',
            //     field: '#MCPD_ORIGCTY->name',
            //     value: 'France',
            //     op: "neq"
            // }, {
            //     type: 'op',
            //     value: 'or'
            // }, {
            //     type: 'term',
            //     field: '#IPGRI_4.1.1->value1',
            //     value: 'Hiver',
            //     op: "eq"
            // }, []]];

            this.collection.fetch({reset: true});
        }
    },

    validateAccessionName: function() {
        var v = this.ui.accession_name.val().trim();

        if (v.length > 0 && v.length < 3) {
            $(this.ui.accession_name).validateField('failed', gt.gettext('3 characters min'));
            return false;
        } else if (this.ui.accession_name.val().length === 0) {
            $(this.ui.accession_name).cleanField();
            return true;
        } else {
            $(this.ui.accession_name).validateField('ok');
            return true;
        }
    },

    onAccessionNameInput: function () {
        return this.validateAccessionName();
    },

    onAdvancedSearch: function () {
        alert("@todo");
    }
});

module.exports = View;

