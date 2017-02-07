/**
 * @file enumsingle.js
 * @brief Display and manage a list a single value format of type of descriptor
 * @author Frederic SCHERMA
 * @date 2017-01-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorFormatType = require('./descriptorformattype');
var Marionette = require('backbone.marionette');

var EnumSingle = function() {
    DescriptorFormatType.call(this);

    this.name = "enum_single";
    this.group = "list";
};

_.extend(EnumSingle.prototype, DescriptorFormatType.prototype, {
    create: function(format, parent, readOnly, descriptorTypeGroup, descriptorTypeId) {
        readOnly || (readOnly = false);

        if (readOnly) {
            var input = null;

            // autocomplete or dropdown
            if (format.list_type === "autocomplete") {
                input = this._createStdInput(parent, "glyphicon-list");
            } else if (format.list_type === "dropdown") {
                input = this._createStdInput(parent, "glyphicon-list");
            }

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            if (format.list_type === "autocomplete") {
                this.autocomplete = true;

                var select = $('<select style="width: 100%;"></select>');
                parent.append(select);

                // init the autocomplete
                var url = application.baseUrl + 'descriptor/group/' + descriptorTypeGroup + '/type/' + descriptorTypeId + '/';
                var initials = [];

                var container = parent.closest('div.modal-dialog').parent();
                if (container.length == 0) {
                    container = parent.closest('div.panel');
                }

                var params = {
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

                            var results = [];

                            for (var i = 0; i < data.items.length; ++i) {
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
                    placeholder: gt.gettext("Enter a value. 3 characters at least for auto-completion")
                };

                select.select2(params);

                this.parent = parent;
                this.el = select;
            } else if (format.list_type === "dropdown") {
                this.autocomplete = false;

                var select = $('<select data-width="100%"></select>');
                parent.append(select);

                select.selectpicker({container: 'body', style: 'btn-default'});

                // init the select2
                var url = application.baseUrl + 'descriptor/group/' + descriptorTypeGroup + '/type/' + descriptorTypeId + '/';

                // refresh values
                this.promise = $.ajax({
                    url: url + 'value/display',
                    dataType: 'json'
                }).done(function (data) {
                    for (var i = 0; i < data.length; ++i) {
                        var option = $("<option></option>");

                        option.attr("value", data[i].value);
                        option.attr("title", data[i].label);

                        // for LTR languages add prefix
                        if (data[i].offset) {
                            var offset = "";
                            for (var j = 0; j < data[i].offset; ++j) {
                                offset += "&#160;&#160;&#160;&#160;";
                            }

                            if (session.languageDirection == "ltr") {
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
                this.el.remove();
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

    set: function (format, definesValues, defaultValues, descriptorTypeGroup, descriptorTypeId) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        var url = application.baseUrl + 'descriptor/group/' + descriptorTypeGroup + '/type/' + descriptorTypeId + '/';

        if (this.readOnly) {
            var type = this;

            if (definesValues) {
                this.el.attr('value', defaultValues[0]);

                $.ajax({
                    type: "GET",
                    url: url + 'value/' + defaultValues[0] + '/display/',
                    dataType: 'json'
                }).done(function (data) {
                    type.el.val(data.label);
                });
            }
        } else {
            if (definesValues) {
                var type = this;

                if (this.autocomplete) {
                    // need to re-init the select2 widget
                    this.el.select2('destroy');

                    // init the autocomplete
                    var initials = [];

                    var container = this.parent.closest('div.modal-dialog').parent();
                    if (container.length == 0) {
                        container = this.parent.closest('div.panel');
                    }

                    var params = {
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

                                var results = [];

                                for (var i = 0; i < data.items.length; ++i) {
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
                        placeholder: gt.gettext("Enter a value. 3 characters at least for auto-completion")
                    };

                    // defines temporary value (before waiting)
                    this.el.attr('value', defaultValues[0]);

                    // autoselect the initial value
                    $.ajax({
                        type: "GET",
                        url: url + 'value/' + defaultValues[0] + '/display/',
                        dataType: 'json'
                    }).done(function (data) {
                        initials.push({id: data.id, text: data.label});

                        params.data = initials;

                        type.el.select2(params);
                        type.el.val(defaultValues).trigger('change');

                        // remove temporary value
                        type.el.removeAttr('value');
                    });
                } else {
                    // defines temporary value (before waiting)
                    this.el.attr('value', defaultValues[0]);

                    $.when(this.promise).done(function (data) {
                        type.el.val(defaultValues[0]).trigger('change');
                        type.el.selectpicker('refresh');

                        // remove temporary vale
                        type.el.removeAttr('value');
                    });
                }
            }
        }
    },

    values: function() {
        if (this.el && this.parent) {
            if (this.readOnly) {
                return [this.el.attr('value')];
            } else {
                if (this.el.attr('value') !== undefined) {
                    return [this.el.attr('value')];
                } else {
                    return [this.el.val()];
                }
            }
        }

        return [""];
    },

    checkCondition: function (condition, values) {
        switch (condition) {
            case 0:
                return this.values()[0] === "";
            case 1:
                return this.values()[0] !== "";
            case 2:
                return this.values()[0] === values[0];
            case 3:
                return this.values()[0] !== values[0];
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
        var display = this.checkCondition(this.conditionType, this.conditionValues);

        // show or hide the parent element
        if (display) {
            for (var i = 0; i < this.listeners.length; ++i) {
                this.listeners[i].parent.parent().show(true);
            }
        } else {
            for (var i = 0; i < this.listeners.length; ++i) {
                this.listeners[i].parent.parent().hide(true);
            }
        }
    },

    onValueUnselected: function(e) {
        var display = false;

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
            for (var i = 0; i < this.listeners.length; ++i) {
                this.listeners[i].parent.parent().show(true);
            }
        } else {
            for (var i = 0; i < this.listeners.length; ++i) {
                this.listeners[i].parent.parent().hide(true);
            }
        }
    }
});

EnumSingle.DescriptorTypeDetailsView = Marionette.ItemView.extend({
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

        var format = this.model.get('format');

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