/**
 * @file descriptorformattype.js
 * @brief Base class for any descriptor format type widgets.
 * @author Frederic SCHERMA
 * @date 2017-01-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorFormatType = function() {
    this.name ="";          // format type name
    this.group = "";        // related group name

    this.readOnly = false;  // true mean the widget is read only
    this.parent = null;     // direct parent
    this.el = null;         // element itself

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

    // create a simple input widget within an input-group and with a specified glyphicon (bootstrap)
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

    create: function(format, parent, readOnly) {
        /* create/init the widget */
    },

    destroy: function() {
        /* destroy the widget if created */
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
        return [""];
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