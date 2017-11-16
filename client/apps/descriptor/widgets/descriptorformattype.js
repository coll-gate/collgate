/**
 * @file descriptorformattype.js
 * @brief Base class for any descriptor format type widgets.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescribableValueHistoryDialog = require('../views/describablevaluehistory');

let DescriptorFormatType = function() {
    this.name = "";         // format type name
    this.group = "";        // related informal group name

    this.readOnly = false;  // true mean the widget is read only
    this.parent = null;     // direct parent
    this.el = null;         // element itself
    this.groupEl = null;    // group (container) element
    this.allow_multiple = false; // true mean the widget can send a list of values

    // standard css style for span
    this.spanStyle = {"padding-top": "3px", "padding-bottom": "3px"};

    // standard css style for span
    this.historySpanStyle = {
        "padding-top": "3px", "padding-bottom": "3px", "padding-left": "6px", "padding-right": "6px"};

    // standard css style for input or select
    this.inputStyle = {"width": "100%", "height": "24px", "padding-top": "3px", "padding-bottom": "3px"};
};

DescriptorFormatType.prototype = {
    // return true if the there is one or more defaults values
    isValueDefined: function (definesValues, defaultValues) {
        return !!definesValues && defaultValues !== null;
    },

    /**
     * Create a simple input widget within an input-group and with a specified glyphicon (bootstrap).
     * @param parent Parent element
     * @param glyphicon Name of the glyphicon (bootstrap)
     * @returns {*|jQuery|HTMLElement} input
     * @private
     */
    _createStdInput: function(parent, glyphicon, history) {
        history || (history = false);

        let group = $('<div class="input-group"></div>');
        let glyph = $('<span class="input-group-addon"></span>');

        if (glyphicon.startsWith("fa-")) {
            glyph.append('<span class="fa fa-fw ' + glyphicon + '"></span>');
        } else if (glyphicon.startsWith("glyphicon-")) {
            glyph.append('<span class="glyphicon ' + glyphicon + '"></span>');
        } else {
            glyph.append('<span class="fa fa-fw fa-question"></span>');
        }

        glyph.css(this.spanStyle);

        let input = $('<input class="form-control" readonly="">');
        input.css(this.inputStyle);

        group.append(input);

        // want history
        if (history) {
            let history = $('<span class="input-group-addon btn btn-xs btn-default show-descriptor-history"><span class="fa fa-line-chart"></span></span>');
            history.attr("title", _t("Show history of the value"));
            history.css(this.historySpanStyle)
                .css('cursor', 'pointer')
                .css('border-left-width', '0px');  // avoid double border

            group.append(history);
        }

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
    _createInputGroup: function(parent, glyphicon, input, history) {
        history || (history = false);

        let group = $('<div class="input-group"></div>');
        let glyph = $('<span class="input-group-addon"></span>');

        if (glyphicon.startsWith("fa-")) {
            glyph.append('<span class="fa fa-fw ' + glyphicon + '"></span>');
        } else if (glyphicon.startsWith("glyphicon-")) {
            glyph.append('<span class="glyphicon ' + glyphicon + '"></span>');
        } else {
            glyph.append('<span class="fa fa-fw fa-question"></span>');
        }

        input.addClass('form-control');
        group.append(input);

        // want history
        if (history) {
            let history = $('<span class="input-group-addon btn btn-xs btn-default show-descriptor-history"><span class="fa fa-history"></span></span>');
            history.css('border-left-width', '0px');  // avoid double border

            group.append(history);
        }

        group.append(glyph);

        parent.append(group);

        return group;
    },

    /**
     * Create the widget.
     * @param format
     * @param parent
     * @param options An object of options :
     *  - bool readOnly For reading only if true
     *  - bool history History button
     */
    create: function(format, parent, options) {
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

    set: function (format, definesValues, defaultValues, options) {
        /* define and format value(s) */
    },

    clear: function () {
        /* clear current value */
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
    },

    /**
     * Show a list with the previous value, and in edit mode gives the ability to set one.
     * @param appLabel Name of the application of the related model name.
     * @param modelName Model name.
     * @param objectId Entity integer identifier.
     * @param valueName Name of the value, of the descriptor model type.
     * @param descriptorModelType Descriptor model type.
     * @param options
     */
    showHistory: function(appLabel, modelName, objectId, valueName, descriptorModelType, options) {
        options || (options = {});

        // refresh values
        this.promise = $.ajax({
            url: window.application.url(['audit', 'search', 'history', 'value']),
            dataType: 'json',
            data: {
                app_label: appLabel,
                model: modelName,
                object_id: objectId,
                value: valueName
            }
        }).done(function (data) {
            let dialog = new DescribableValueHistoryDialog({
                entries: data.items,
                readOnly: this.readOnly,
                descriptorModelType: descriptorModelType
            });

            dialog.render();
        });
    }
};

module.exports = DescriptorFormatType;
