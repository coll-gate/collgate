/**
 * @file establishmentlistfilter.js
 * @brief Filter the list of establishment
 * @author Frederic SCHERMA
 * @date 2017-03-09
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'establishment-filter',
    template: require('../templates/establishmentlistfilter.html'),

    ui: {
        filter_btn: 'button.establishment-filter',
        establishment_name: 'input.establishment-name'
    },

    events: {
        'click @ui.filter_btn': 'onFilter',
        'input @ui.establishment_name': 'onEstablishmentNameInput'
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    onRender: function() {
    },

    onFilter: function () {
        if (this.validateEstablishmentName()) {
            this.collection.filters = {
                name: this.ui.establishment_name.val().trim(),
                method: "icontains"
            };

            this.collection.fetch({reset: true});
        }
    },

    validateEstablishmentName: function() {
        var v = this.ui.establishment_name.val().trim();

        if (v.length > 0 && v.length < 3) {
            $(this.ui.establishment_name).validateField('failed', gt.gettext('3 characters min'));
            return false;
        } else if (this.ui.establishment_name.val().length == 0) {
            $(this.ui.establishment_name).cleanField();
            return true;
        } else {
            $(this.ui.establishment_name).validateField('ok');
            return true;
        }
    },

    onEstablishmentNameInput: function () {
        return this.validateEstablishmentName();
    }
});

module.exports = View;
