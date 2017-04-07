/**
 * @file accessionlistfooter.js
 * @brief Filter and configuration for the list of accession
 * @author Frederic SCHERMA
 * @date 2017-03-22
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var ColumnsConfigDialog = require('./columnsconfig');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'accession-footer',
    template: require('../templates/accessionlistfooter.html'),

    ui: {
        filter_btn: 'button.accession-filter',
        accession_name: 'input.accession-name',
        accession_advanced_search: 'button.accession-advanced-search',
        accession_columns_config: 'button.accession-columns-config'
    },

    events: {
        'click @ui.filter_btn': 'onFilter',
        'input @ui.accession_name': 'onAccessionNameInput',
        'click @ui.accession_advanced_search': 'onAdvancedSearch',
        'click @ui.accession_columns_config': 'onColumnsConfig'
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    onRender: function() {
    },

    onFilter: function () {
        if (this.validateAccessionName()) {
            this.collection.filters = {
                name: this.ui.accession_name.val().trim(),
                method: "icontains"
            };

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
    },

    onColumnsConfig: function () {
        // updateUserSetting
        $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/columns/accession.accession/',
            contentType: "application/json; charset=utf-8"
        }).done(function(data) {
            var columnsConfigDialog = new ColumnsConfigDialog(data);
            columnsConfigDialog.render();
        });
    }
});

module.exports = View;
