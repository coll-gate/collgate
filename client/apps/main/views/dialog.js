/**
 * @file dialog.js
 * @brief Dialog helper view.
 * @author Frederic SCHERMA
 * @date 2016-10-21
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: "div",
    attributes: {
        'id': 'dlg_default',
        'class': 'modal',
        'tabindex': -1
    },

    ui: {
        cancel: "button.cancel",
        apply: "button.apply"
    },

    events: {
        'click @ui.cancel': 'onCancel',
        'click @ui.apply': 'onApply',
        'keydown': 'escapeKey',
    },

    constructor: function() {
        var prototype = this.constructor.prototype;

        this.events = {};
        this.defaultOptions = {};
        this.ui = {};
        this.attributes = {};
        this.className = "";

        while (prototype) {
            if (prototype.hasOwnProperty("events")) {
                _.defaults(this.events, prototype.events);
            }
            if (prototype.hasOwnProperty("defaultOptions")) {
                _.defaults(this.defaultOptions, prototype.defaultOptions);
            }
            if (prototype.hasOwnProperty("ui")) {
                _.defaults(this.ui, prototype.ui);
            }
            if (prototype.hasOwnProperty("attributes")) {
                _.defaults(this.attributes, prototype.attributes);
            }
            if (prototype.hasOwnProperty("className")) {
                this.className += " " + prototype.className;
            }
            prototype = prototype.constructor.__super__;
        }

        Marionette.View.apply(this, arguments);
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this);
    },

    onRender: function () {
        $(this.el).modal();
        $(this.el).find(':input[autofocus]').focus();
    },

    onCancel: function () {
        this.remove();
    },

    escapeKey: function(e) {
        var code = e.keyCode || e.which;

        // escape key cancel
        if (code == 27) {
            this.remove();
        }

        // enter on num-pad enter
        if (code == 13) {
            // click apply
            this.triggerMethod('apply');

            // avoid reload page
            return false;
        }
    },

    remove: function() {
        $(this.el).modal('hide').data('bs.modal', null);

        // unbind the events
        this.$el.empty().off();
        this.stopListening();

        return View.__super__.remove.apply(this);
    },

    close: function () {
        $(this.el).modal('hide').data('bs.modal', null);
    },

    /*onBeforeDestroy: function() {
        $(this.el).modal('hide').data('bs.modal', null);
    }*/
});

module.exports = View;
