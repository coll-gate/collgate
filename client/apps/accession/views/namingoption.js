/**
 * @file namingoption.js
 * @brief Naming option definition inner view.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-01-15
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    className: 'naming-option',
    attributes: {
        'style': 'padding-top: 5px; padding-bottom: 10px; margin-bottom: 10px; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd;'
    },
    template: require('../templates/namingoption.html'),
    templateContext: function () {
        return {
            namingOptions: this.namingOptions,
        }
    },

    ui: {
        "format": "input[name=naming-format]",
        "constants": "input[name=naming-constant]"
    },

    initialize: function (options) {
        this.namingOptions = options.namingOptions || 0;
        this.namingFormat = options.namingFormat || "";
    },

    onRender: function () {
        this.ui.format.val(this.namingFormat);
    },

    setNamingOptions: function(namingOptions) {
        if (namingOptions.length !== this.ui.constants.length) {
            return;
        }

         for (let i = 0; i < this.ui.constants.length; ++i) {
            this.ui.constants.eq(i).val(namingOptions[i]);
        }
    },

    getNamingOptions: function () {
        let res = [];

        for (let i = 0; i < this.ui.constants.length; ++i) {
            res.push(this.ui.constants.eq(i).val());
        }

        return res;
    },

    validateNamingOptions: function() {
        // @todo
        return true;
    }
});

module.exports = View;
