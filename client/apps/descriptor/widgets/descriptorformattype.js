/**
 * @file descriptorformattype.js
 * @brief Base class for any descriptor format type widgets.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var DescriptorFormatType = function() {
    this.name = "";         // format type name
    this.group = "";        // related informal group name

    this.readOnly = false;  // true mean the widget is read only
    this.parent = null;     // direct parent
    this.el = null;         // element itself
    this.groupEl = null;    // group (container) element
    this.allow_multiple = false; // true mean the widget can send a list of values

    // standard css style for span
    this.spanStyle = {"padding-top": "3px", "padding-bottom": "3px"};

    // standard css style for input or select
    this.inputStyle = {"width": "100%", "height": "24px", "padding-top": "3px", "padding-bottom": "3px"};
};

DescriptorFormatType.prototype = {
    // return true if the there is one or more defaults values
    isValueDefined: function (definesValues, defaultValues) {
        return !!definesValues && !!defaultValues && defaultValues != null;
    },

    /**
     * Create a simple input widget within an input-group and with a specified glyphicon (bootstrap).
     * @param parent Parent element
     * @param glyphicon Name of the glyphicon (bootstrap)
     * @returns {*|jQuery|HTMLElement} input
     * @private
     */
    _createStdInput: function(parent, glyphicon) {
        var group = $('<div class="input-group"></div>');
        var glyph = $('<span class="input-group-addon"><span class="glyphicon ' + glyphicon + '"></span></span>');
        glyph.css(this.spanStyle);

        var input = $('<input class="form-control" readonly="">');
        input.css(this.inputStyle);

        group.append(input);
        group.append(glyph);

        parent.append(group);

        return input;
    },

    /**
     * Create a simple input-group and with a specified glyphicon (bootstrap), set the specific input.
     * @param parent Parent element
     * @param glyphicon Name of the glyphicon (bootstrap)
     * @param input Input element to bind into the group
     * @return {*|jQuery|HTMLElement} The created group
     */
    _createInputGroup: function(parent, glyphicon, input) {
        var group = $('<div class="input-group"></div>');
        var glyph = $('<span class="input-group-addon"><span class="glyphicon ' + glyphicon + '"></span></span>');
        glyph.css(this.spanStyle);

        input.addClass('form-control');
        // input.css(this.inputStyle);

        group.append(input);
        group.append(glyph);

        parent.append(group);

        return group;
    },

    create: function(format, parent, readOnly) {
        /* create/init the widget */
    },

    destroy: function() {
        /* destroy the widget if created */
    },

    cancel: function() {
        /* for widgets that performs global or server operation, and must clean such operations before destroying the
         *  widget, it must then implement the way to remove those such resources.
         */
    },

    enable: function() {
        /* enable the widget */
    },

    disable: function() {
        /* disable the widget */
    },

    set: function (format, definesValues, defaultValues, descriptorTypeGroup, descriptorTypeId) {
        /* define and format value(s) */
    },

    values: function() {
        /* return the formatted values */
        return null;
    },

    compare: function(a, b) {
        if (typeof a !== typeof b) {
            return false;
        }

        /* compare two values and return true if they are equals */
        return a === b;
    },

    checkCondition: function (condition, value) {
        /* check if the value of the widget respect the condition and the given value */
        return true;
    },

    bindConditionListener: function(listeners, condition, values) {
        /* bind an array of widget that are shown or hidden according the the given condition and values */
    }
};

module.exports = DescriptorFormatType;
