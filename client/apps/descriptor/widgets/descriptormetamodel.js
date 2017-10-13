/**
 * @file descriptormetamodel.js
 * @brief Display and manage a meta-model of descriptor reference value format
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-07-10
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var DescriptorFormatType = require('./descriptorformattype');

var DescriptorMetaModel = function () {
    DescriptorFormatType.call(this);

    this.name = "descriptor_meta_model";
    this.group = "reference";

    this.searchUrl = null;
    this.allow_multiple = true
};

_.extend(DescriptorMetaModel.prototype, DescriptorFormatType.prototype, {
    create: function (format, parent, readOnly, descriptorTypeGroup, descriptorTypeId, options) {
        readOnly || (readOnly = false);
        options || (options = {
            multiple: false
        });

        if (readOnly) {
            var input = this._createStdInput(parent, "fa-folder-open");

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            var select = $('<select style="width: 100%;" ' + (options.multiple ? "multiple" : "") + '></select>');
            this.groupEl = this._createInputGroup(parent, "fa-th-large", select);

            // init the autocomplete
            var url = window.application.url(['descriptor', 'meta-model']);
            var initials = [];

            var container = parent.closest('div.modal-dialog').parent();
            if (container.length === 0) {
                container = this.groupEl;  // parent.closest('div.panel');
            }

            var params = {
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
                                fields: ['name_or_label', 'model'],
                                name: params.term,
                                model: format.model
                            }),
                            cursor: params.next
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
                placeholder: _t("Enter a value.")
            };

            // make an autocomplete widget on simple_value
            select.select2(params).fixSelect2Position();

            this.parent = parent;
            this.el = select;
        }
    },

    destroy: function () {
        if (this.el && this.parent) {
            if (this.readOnly) {
                this.el.parent().remove();
            } else {
                this.el.select2('destroy');
                this.groupEl.remove();
            }
        }
    },

    enable: function () {
        if (this.el) {
            this.el.prop("disabled", false);
        }
    },

    disable: function () {
        if (this.el) {
            this.el.prop("disabled", true);
        }
    },

    set: function (format, definesValues, defaultValues, descriptorTypeGroup, descriptorTypeId) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        var url = window.application.url(['descriptor', 'meta-model']);

        if (this.readOnly) {
            var type = this;

            if (definesValues) {
                this.el.attr('value', defaultValues);

                $.ajax({
                    type: "GET",
                    url: window.application.url([url, defaultValues]),
                    dataType: 'json'
                }).done(function (data) {
                    type.el.val(data.name);
                });
            }
        } else {
            if (definesValues) {
                var type = this;

                // need to re-init the select2 widget
                this.el.select2('destroy');

                // init the autocomplete
                var initials = [];

                var container = this.parent.closest('div.modal-dialog').parent();
                if (container.length === 0) {
                    container = this.groupEl;  // this.parent.closest('div.panel');
                }

                var params = {
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
                                    fields: ['name_or_label', 'model'],
                                    name: params.term,
                                    model: format.model
                                }),
                                cursor: params.next
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
                    placeholder: _t("Enter a value.")
                };

                // autoselect the initial value
                $.ajax({
                    type: "GET",
                    url: url + defaultValues + '/',
                    dataType: 'json'
                }).done(function (data) {
                    initials.push({id: data.id, text: data.name});

                    params.data = initials;

                    type.el.select2(params).fixSelect2Position();
                    type.el.val(defaultValues).trigger('change');
                });
            }
        }
    },

    values: function () {
        if (this.el && this.parent) {
            if (this.readOnly) {
                var value = parseInt(this.el.attr('value'));
                return isNaN(value) ? null : value;
            } else {
                if (this.el.attr('value') !== undefined) {
                    var value = parseInt(this.el.attr('value'));
                    return isNaN(value) ? null : value;
                } else {
                    if (Array.isArray(this.el.val())) {
                        var values = this.el.val();
                        return values.map(function (value) {
                            value = parseInt(value);
                            return isNaN(value) ? null : value
                        })
                    } else if (this.el.val() !== "") {
                        var value = parseInt(this.el.val());
                        return isNaN(value) ? null : value;
                    } else {
                        return null;
                    }
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

// not edition view

module.exports = DescriptorMetaModel;
