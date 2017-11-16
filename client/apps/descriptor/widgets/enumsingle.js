/**
 * @file enumsingle.js
 * @brief Display and manage a list a single value format of type of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescriptorFormatType = require('./descriptorformattype');
let Marionette = require('backbone.marionette');

let EnumSingle = function() {
    DescriptorFormatType.call(this);

    this.name = "enum_single";
    this.group = "list";

    this.autocomplete = false;
    this.allow_multiple = true;
};

_.extend(EnumSingle.prototype, DescriptorFormatType.prototype, {
    create: function(format, parent, options) {
        options || (options = {
            readOnly: false,
            history: false,
            multiple: false,
            descriptorTypeId: 0
        });

        if (options.readOnly) {
            let input = null;

            // autocomplete or dropdown
            if (format.list_type === "autocomplete") {
                input = this._createStdInput(parent, "fa-list", options.history);
            } else if (format.list_type === "dropdown") {
                input = this._createStdInput(parent, "fa-list", options.history);
            }

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            if (format.list_type === "autocomplete") {
                this.autocomplete = true;

                let select = $('<select style="width: 100%;" ' + (options.multiple ? "multiple" : "") + '></select>');
                this.groupEl = this._createInputGroup(parent, "fa-list", select, options.history);

                // init the autocomplete
                let url = window.application.url(['descriptor', 'type', options.descriptorTypeId]);
                let initials = [];

                let container = parent.closest('div.modal-dialog').parent();
                if (container.length === 0) {
                    container = this.groupEl;  // parent.closest('div.panel');
                }

                let params = {
                    data: initials,
                    dropdownParent: container,
                    ajax: {
                        url: url + 'value/display/search/',
                        dataType: 'json',
                        delay: 250,
                        data: function (params) {
                            params.term || (params.term = '');

                            return {
                                cursor: params.next,
                                value: params.term
                            };
                        },
                        processResults: function (data, params) {
                            params.next = null;

                            if (data.items.length >= 30) {
                                params.next = data.next || null;
                            }

                            let results = [];

                            for (let i = 0; i < data.items.length; ++i) {
                                results.push({
                                    id: data.items[i].id,
                                    text: data.items[i].label
                                });
                            }

                            return {
                                results: results,
                                pagination: {
                                    more: params.next != null
                                }
                            };
                        },
                        cache: true
                    },
                    allowClear: true,
                    minimumInputLength: 3,
                    placeholder: _t("Enter a value.")
                };

                select.select2(params).fixSelect2Position();

                this.parent = parent;
                this.el = select;
            } else if (format.list_type === "dropdown") {
                this.autocomplete = false;

                let select = $('<select style="width: 100%;" ' + (options.multiple ? "multiple" : "") + '></select>');
                this.groupEl = this._createInputGroup(parent, "fa-list", select);

                // undefined value
                let undefinedOption = $('<option value="null"> - ' + _t("Undefined") + ' - </option>');
                select.append(undefinedOption);

                select.selectpicker({container: 'body', style: 'btn-default'});

                // init the selectpicker
                let url = window.application.url(['descriptor', 'type', options.descriptorTypeId]);

                // refresh values
                this.promise = $.ajax({
                    url: url + 'value/display/',
                    dataType: 'json'
                }).done(function (data) {
                    for (let i = 0; i < data.length; ++i) {
                        let option = $("<option></option>");

                        option.attr("value", data[i].value);
                        option.attr("title", data[i].label);

                        // for LTR languages add prefix
                        if (data[i].offset) {
                            let offset = "";
                            for (let j = 0; j < data[i].offset; ++j) {
                                offset += "&#160;&#160;&#160;&#160;";
                            }

                            if (session.languageDirection === "ltr") {
                                option.html(offset + data[i].label);
                            } else {
                                option.html(data[i].label + offset);
                            }
                        } else {
                            option.html(data[i].label);
                        }

                        select.append(option);
                    }

                    select.selectpicker('refresh');
                });

                this.parent = parent;
                this.el = select;
            }
        }
    },

    destroy: function() {
        if (this.el && this.parent) {
            if (this.readOnly) {
                this.el.parent().remove();
            } else {
                if (this.autocomplete) {
                    this.el.select2('destroy');
                } else {
                    this.el.selectpicker('destroy');
                }
                this.groupEl.remove();
            }
        }
    },

    enable: function() {
        if (this.el) {
            if (this.autocomplete) {
                this.el.prop("disabled", false);
            } else {
                this.el.prop("disabled", false).selectpicker('refresh');
            }
        }
    },

    disable: function() {
        if (this.el) {
            if (this.autocomplete) {
                this.el.prop("disabled", true);
            } else {
                this.el.prop("disabled", true).selectpicker('refresh');
            }
        }
    },

    set: function (format, definesValues, defaultValues, options) {
        options || (options = {
            descriptorTypeId: 0
        });

        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        let url = window.application.url(['descriptor', 'type', options.descriptorTypeId]);

        if (this.readOnly) {
            let type = this;

            if (definesValues) {
                this.el.attr('value', defaultValues);

                $.ajax({
                    type: "GET",
                    url: url + 'value/' + defaultValues + '/display/',
                    dataType: 'json'
                }).done(function (data) {
                    type.el.val(data.label);
                });
            } else {
                type.el.val("");
            }
        } else {
            let type = this;
            let multiple = this.el.prop("multiple");

            if (this.autocomplete) {
                if (definesValues) {
                    let initials = [];

                    if (multiple && _.isArray(defaultValues)) {
                        // @todo multiple ?
                    }

                    // is the option exists
                    if (type.el.children('option[value=' + defaultValues + ']').length) {
                        type.el.trigger({
                            type: 'select2:select',
                            params: {
                                data: initials
                            }
                        });
                    } else {
                        // autoselect the initial value
                        $.ajax({
                            type: "GET",
                            url: url + 'value/' + defaultValues + '/display/',
                            dataType: 'json'
                        }).done(function (data) {
                            initials.push({id: data.id, text: data.name});

                            let option = new Option(data.name, data.id, true, true);
                            type.el.append(option).trigger('change');

                            type.el.trigger({
                                type: 'select2:select',
                                params: {
                                    data: initials
                                }
                            });
                        });
                    }
                } else {
                    // clear value(s)
                    type.el.val(null).trigger('change');
                }
            } else {
                if (definesValues) {
                    // defines temporary value (before waiting)
                    this.el.attr('value', defaultValues);

                    if (multiple && _.isArray(defaultValues)) {
                        // @todo multiple ?
                    }

                    // undefined value
                    if (_.isUndefined(defaultValues)) {
                        type.el.val("null").trigger('change');
                        type.el.selectpicker('refresh');
                    }

                    $.when(this.promise).done(function (data) {
                        type.el.val(defaultValues).trigger('change');
                        type.el.selectpicker('refresh');

                        // remove temporary vale
                        type.el.removeAttr('value');
                    });
                } else {
                    // clear value(s)
                    type.el.val("null").trigger('change');
                }
            }
        }
    },

    values: function() {
        if (this.el && this.parent) {
            if (this.readOnly) {
                return this.el.attr('value');
            } else {
                if (this.el.attr('value') !== undefined) {
                    return this.el.attr('value');
                } else {
                    let val = this.el.val();
                    return val !== "null" ? val : null;
                }
            }
        }

        return null;
    },

    checkCondition: function (condition, values) {
        switch (condition) {
            case 0:
                return this.values() === null;
            case 1:
                return this.values() !== null;
            case 2:
                return this.values() === values;
            case 3:
                return this.values() !== values;
            default:
                return false;
        }
    },

    bindConditionListener: function(listeners, condition, values) {
        if (this.el && this.parent && !this.readOnly) {
            if (!this.bound) {
                if (this.autocomplete) {
                    this.el.on("select2:select", $.proxy(this.onValueChanged, this));
                    this.el.on("select2:unselect", $.proxy(this.onValueUnselected, this));
                } else {
                    this.el.parent('div.bootstrap-select').on('changed.bs.select', $.proxy(this.onValueChanged, this));
                }
                this.bound = true;
            }

            this.conditionType = condition;
            this.conditionValues = values;
            this.listeners = listeners || [];
        }
    },

    onValueChanged: function(e) {
        let display = this.checkCondition(this.conditionType, this.conditionValues);

        // show or hide the parent element
        if (display) {
            for (let i = 0; i < this.listeners.length; ++i) {
                this.listeners[i].parent.parent().show(true);
            }
        } else {
            for (let i = 0; i < this.listeners.length; ++i) {
                this.listeners[i].parent.parent().hide(true);
            }
        }
    },

    onValueUnselected: function(e) {
        let display = false;

        switch (this.conditionType) {
            case 0:
                display = true;
                break;
            case 1:
                display = false;
                break;
            case 2:
                display = false;
                break;
            case 3:
                display = false;
                break;
            default:
                break;
        }

        // show or hide the parent element
        if (display) {
            for (let i = 0; i < this.listeners.length; ++i) {
                this.listeners[i].parent.parent().show(true);
            }
        } else {
            for (let i = 0; i < this.listeners.length; ++i) {
                this.listeners[i].parent.parent().hide(true);
            }
        }
    }
});

EnumSingle.DescriptorTypeDetailsView = Marionette.View.extend({
    className: 'descriptor-type-details-format',
    template: require('../templates/widgets/enumsingle.html'),

    ui: {
        format_trans: "#format_trans",
        field0: '#type_field0',
        sort_by_field: '#sort_by_field',
        list_type: '#list_type'
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        this.ui.format_trans.selectpicker({style: 'btn-default', container: 'body'});

        this.ui.sort_by_field.selectpicker({style: 'btn-default'});
        this.ui.list_type.selectpicker({style: 'btn-default'});

        let format = this.model.get('format');

        if (format.fields != undefined) {
            if (format.fields.length >= 1)
                this.ui.field0.val(format.fields[0]);
        }

        if (format.sortby_field != undefined) {
            this.ui.sort_by_field.selectpicker('val', format.sortby_field);
        }

        if (format.list_type != undefined) {
            this.ui.list_type.selectpicker('val', format.list_type);
        }
    },

    getFormat: function() {
        return {
            'trans': this.ui.format_trans.val() === "true",
            'fields': [this.ui.field0.val()],
            'sortby_field': this.ui.sort_by_field.val(),
            'display_fields': 'value0',
            'list_type': this.ui.list_type.val(),
            'search_field': 'value0'
        }
    }
});

module.exports = EnumSingle;
