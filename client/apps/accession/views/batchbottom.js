/**
 * @file batchbottom.js
 * @brief Filter and action on a list of batches
 * @author Frederic SCHERMA
 * @date 2017-02-24
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'batch-bottom',
    template: require('../templates/batchbottom.html'),

    ui: {
        filter_btn: 'button.batch-filter',
        batch_name: 'input.taxon-name',
        action: 'select.batch-action-type'
    },

    events: {
        'click @ui.filter_btn': 'onFilter',
        'input @ui.batch_name': 'onBatchNameInput'
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    onRender: function() {
        application.accession.views.batchActionTypes.drawSelect(this.ui.action, true, true);
    },

    onFilter: function () {
        if (this.validateBatchName()) {
            this.collection.filters = {
                name: this.ui.batch_name.val(),
                method: "icontains"
            };

            this.collection.fetch({reset: true});
        }
    },

    validateBatchName: function() {
        var v = this.ui.batch_name.val().trim();
        var re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.batch_name).validateField('failed', gt.gettext("Invalid characters (alphanumeric, _ and - only)"));
            return false;
        } else if (v.length > 0 && v.length < 3) {
            $(this.ui.batch_name).validateField('failed', gt.gettext('3 characters min'));
            return false;
        } else if (this.ui.batch_name.val().length == 0) {
            $(this.ui.batch_name).cleanField();
            return true;
        } else {
            $(this.ui.batch_name).validateField('ok');
            return true;
        }
    },

    onBatchNameInput: function () {
        return this.validateBatchName();
    }
});

module.exports = View;