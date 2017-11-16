/**
 * @file entity.js
 * @brief Display and manage an entity reference value format of type of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescriptorFormatType = require('./descriptorformattype');
let Marionette = require('backbone.marionette');

let Entity = function () {
    DescriptorFormatType.call(this);

    this.name = "entity";
    this.group = "reference";

    this.searchUrl = null;
    this.autocomplete = false;
    this.allow_multiple = true
};

_.extend(Entity.prototype, DescriptorFormatType.prototype, {
    create: function (format, parent, options) {
        options || (options = {
            history: false,
            readOnly: false,
            multiple: false
        });

        if (options.readOnly) {
            let input = this._createStdInput(parent, "fa-share", options.history);

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            if (!format.list_type || format.list_type === "autocomplete") {
                this.autocomplete = true;

                let select = $('<select style="width: 100%;" ' + (options.multiple ? "multiple" : "") + '></select>');
                this.groupEl = this._createInputGroup(parent, "fa-share", select, options.history);

                // init the autocomplete
                let url = window.application.url() + (this.searchUrl ? this.searchUrl : (format.model.replace('.', '/') + '/'));
                let initials = [];

                let container = parent.closest('div.modal-dialog').parent();
                if (container.length === 0) {
                    container = this.groupEl;  // parent.closest('div.panel');
                }

                let params = {
                    // width: 'element',
                    data: initials,
                    dropdownParent: container,
                    ajax: {
                        url: url + 'search/',
                        dataType: 'json',
                        delay: 250,
                        data: function (params) {
                            params.term || (params.term = '');

                            return {
                                filters: JSON.stringify({
                                    method: 'icontains',
                                    fields: ['name'],
                                    name: params.term
                                }),
                                cursor: params.next
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

                // make an autocomplete widget on simple_value
                select.select2(params).fixSelect2Position();

                this.parent = parent;
                this.el = select;
            } else if (format.list_type === 'dropdown') {
                this.autocomplete = false;

                let select = $('<select style="width: 100%;" ' + (options.multiple ? "multiple" : "") + '></select>');
                this.groupEl = this._createInputGroup(parent, "fa-share", select, options.history);

                select.selectpicker({container: 'body', style: 'btn-default'});

                // init the selectpicker
                let url = window.application.url() + (this.searchUrl ? this.searchUrl : (format.model.replace('.', '/') + '/'));

                // refresh values
                this.promise = $.ajax({
                    url: url + 'search/',
                    dataType: 'json',
                    data: {filters: "{}"}
                }).done(function (data) {
                    for (let i = 0; i < data.items.length; ++i) {
                        let option = $("<option></option>");
                        let item = data.items[i];

                        option.attr("value", item.value || item.id);
                        option.attr("title", item.label || item.name);
                        option.html(item.label || item.name);

                        select.append(option);
                    }

                    select.selectpicker('refresh');
                });

                this.parent = parent;
                this.el = select;
            }
        }
    },

    destroy: function () {
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

    enable: function () {
        if (this.el) {
            if (this.autocomplete) {
                this.el.prop("disabled", false);
            } else {
                this.el.prop("disabled", false).selectpicker('refresh');
            }
        }
    },

    disable: function () {
        if (this.el) {
            if (this.autocomplete) {
                this.el.prop("disabled", true);
            } else {
                this.el.prop("disabled", true).selectpicker('refresh');
            }
        }
    },

    set: function (format, definesValues, defaultValues, options) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        let url = window.application.url() + (this.searchUrl ? this.searchUrl : (format.model.replace('.', '/') + '/'));

        if (this.readOnly) {
            let type = this;

            if (definesValues) {
                this.el.attr('value', defaultValues);

                $.ajax({
                    type: "GET",
                    url: url + defaultValues + '/',
                    dataType: 'json'
                }).done(function (data) {
                    type.el.val(data.name);
                });
            } else {
                this.el.attr('value', "").val("");
            }
        } else {
            let type = this;

            if (this.autocomplete) {
                if (definesValues) {
                    let initials = [];

                    // @todo multiple ?

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
                            url: url + defaultValues + '/',
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
                    this.el.val(null).trigger('change');
                }
            } else {
                if (definesValues) {
                    // defines temporary value (before waiting)
                    this.el.attr('value', defaultValues);

                    $.when(this.promise).done(function (data) {
                        type.el.val(defaultValues).trigger('change');
                        type.el.selectpicker('refresh');

                        // remove temporary vale
                        type.el.removeAttr('value');
                    });
                } else {
                    this.el.val(null).trigger('change');
                }
            }
        }
    },

    clear: function () {
        if (this.el && this.parent) {
            if (this.readOnly) {
                this.el.attr('value', null);
                this.el.val('');
            } else {
                this.el.val(null).trigger('change');
            }
        }
    },

    values: function () {
        if (this.el && this.parent) {
            if (this.readOnly) {
                return this.el.attr('value');
            } else {
                if (Array.isArray(this.el.val())) {
                    let values = this.el.val();
                    return values.map(function (value) {
                        value = parseInt(value);
                        return isNaN(value) ? null : value
                    })
                } else if (this.el.val() !== "") {
                    let value = parseInt(this.el.val());
                    return isNaN(value) ? null : value;
                } else {
                    return null;
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
    }
});

Entity.DescriptorTypeDetailsView = Marionette.View.extend({
    className: 'descriptor-type-details-format',
    template: require('../templates/widgets/entity.html'),

    ui: {
        format_model: '#format_model'
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function () {
        let format = this.model.get('format');
        application.descriptor.views.describables.drawSelect(this.ui.format_model, true, false, format.model);
    },

    getFormat: function () {
        return {
            'model': this.ui.format_model.val()
        }
    }
});

module.exports = Entity;
