/**
 * @file cultivarlistfilter.js
 * @brief Filter the list of cultivar
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-05-04
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'cultivar-filter',
    template: require('../templates/cultivarlistfilter.html'),

    ui: {
        filter_btn: 'button.cultivar-filter',
        cultivar_name: 'input.cultivar-name'
    },

    events: {
        'click @ui.filter_btn': 'onFilter',
        'input @ui.cultivar_name': 'onCultivarNameInput'
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    onFilter: function () {
        if (this.validateCultivarName()) {
            this.collection.filters = {
                name: this.ui.cultivar_name.val().trim(),
                rank: 90,  // cultivar rank
                method: "icontains"
            };

            this.collection.fetch({reset: true});
        }
    },

    validateCultivarName: function() {
        var v = this.ui.cultivar_name.val().trim();

        if (v.length > 0 && v.length < 3) {
            $(this.ui.cultivar_name).validateField('failed', gt.gettext('3 characters min'));
            return false;
        } else if (this.ui.cultivar_name.val().length === 0) {
            $(this.ui.cultivar_name).cleanField();
            return true;
        } else {
            $(this.ui.cultivar_name).validateField('ok');
            return true;
        }
    },

    onCultivarNameInput: function () {
        return this.validateCultivarName();
    }
});

module.exports = View;
