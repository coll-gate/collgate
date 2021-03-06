/**
 * @file country.js
 * @brief Geolocation country widget
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-02-23
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescriptorFormatType = require('../../descriptor/widgets/descriptorformattype');
let Marionette = require('backbone.marionette');

let CountryType = function () {
    DescriptorFormatType.call(this);

    this.name = "country";
    this.group = "country";
    this.allow_multiple = true
};

_.extend(CountryType.prototype, DescriptorFormatType.prototype, {
    create: function (format, parent, options) {
        options || (options = {
            readOnly: false,
            history: false,
            multiple: false
        });

        if (options.readOnly) {
            let input = this._createStdInput(parent, "fa-globe", options.history);

            this.parent = parent;
            this.readOnly = true;
            this.el = input;

        } else {
            let select = $('<select style="width: 100%;" ' + (options.multiple ? "multiple" : "") + '></select>');
            parent.append(select);
            this.groupEl = this._createInputGroup(parent, "fa-globe", select, options.history);

            // init the autocomplete
            let url = window.application.url(['geolocation', 'country', 'search']);
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
                    url: url,
                    dataType: 'json',
                    delay: 250,
                    data: function (params) {
                        params.term || (params.term = '');

                        return {
                            cursor: params.next,
                            term: params.term
                        };
                    },
                    processResults: function (data, params) {
                        params.next = null;

                        if (data.items.length >= 30) {
                            params.next = data.next || null;
                        }

                        let results = [];

                        for (let i = 0; i < data.items.length; ++i) {

                            let display = '';

                            if (data.items[i].preferred_names) {
                                display = data.items[i].preferred_names;
                            } else if (data.items[i].short_names) {
                                display = data.items[i].short_names;
                            } else if (data.items[i].display_names) {
                                display = data.items[i].display_names;
                            } else {
                                display = data.items[i].name;
                            }

                            results.push({
                                id: data.items[i].id,
                                text: display
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

    set: function (format, definesValues, defaultValues, options) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        let type = this;

        if (this.readOnly) {
            if (defaultValues) {
                // defines value as attribute
                this.el.attr('value', defaultValues);

                $.ajax({
                    type: "GET",
                    url: window.application.url(['geolocation', 'country', defaultValues]),
                    dataType: 'json'
                }).done(function (data) {
                    let display = '';

                    if (data.preferred_names) {
                        display = data.preferred_names;
                    } else if (data.short_names) {
                        display = data.short_names;
                    } else if (data.display_names) {
                        display = data.display_names;
                    } else {
                        display = data.name;
                    }

                    type.el.val(display);
                });
            } else {
                this.el.attr('value', "").val("");
            }
        } else {
            if (definesValues) {
                // defines value as attribute
                this.el.attr('value', defaultValues);

                // need to re-init the select2 widget
                this.el.select2('destroy');

                // init the autocomplete
                let url = window.application.url(['geolocation', 'country']);
                let initials = [];

                let container = this.parent.closest('div.modal-dialog').parent();
                if (container.length === 0) {
                    container = this.groupEl;  // parent.closest('div.panel');
                }

                let params = {
                    data: initials,
                    dropdownParent: container,
                    ajax: {
                        url: url + 'search/',
                        dataType: 'json',
                        delay: 250,
                        data: function (params) {
                            params.term || (params.term = '');

                            return {
                                cursor: params.next,
                                term: params.term
                            };
                        },
                        processResults: function (data, params) {
                            params.next = null;

                            if (data.items.length >= 30) {
                                params.next = data.next || null;
                            }

                            let results = [];

                            for (let i = 0; i < data.items.length; ++i) {
                                let display = '';

                                if (data.items[i].preferred_names) {
                                    display = data.items[i].preferred_names;
                                } else if (data.items[i].short_names) {
                                    display = data.items[i].short_names;
                                } else if (data.items[i].display_names) {
                                    display = data.items[i].display_names;
                                } else {
                                    display = data.items[i].name;
                                }

                                results.push({
                                    id: data.items[i].id,
                                    text: display
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
                    let display = '';

                    if (data.preferred_names) {
                        display = data.preferred_names;
                    } else if (data.short_names) {
                        display = data.short_names;
                    } else if (data.display_names) {
                        display = data.display_names;
                    } else {
                        display = data.name;
                    }

                    initials.push({id: data.id, text: display});
                    params.data = initials;
                    type.el.select2(params).fixSelect2Position();
                    type.el.val(defaultValues).trigger('change');

                    // remove temporary value
                    type.el.removeAttr('value');
                });
            } else {
                this.el.val(null).trigger('change');
            }
        }
    },

    values: function () {
        if (this.el && this.parent) {
            if (this.readOnly) {
                let value = parseInt(this.el.attr('value'));
                return isNaN(value) ? null : value;
            } else {
                if (this.el.attr('value') !== undefined) {
                    let value = parseInt(this.el.attr('value'));
                    return isNaN(value) ? null : value;
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

    bindConditionListener: function (listeners, condition, values) {
        if (this.el && this.parent && !this.readOnly) {
            if (!this.bound) {
                this.el.on("select2:select", $.proxy(this.onValueChanged, this));
                this.el.on("select2:unselect", $.proxy(this.onValueUnselected, this));

                this.bound = true;
            }

            this.conditionType = condition;
            this.conditionValues = values;
            this.listeners = listeners || [];
        }
    },

    onValueChanged: function (e) {
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

    onValueUnselected: function (e) {
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

CountryType.DescriptorTypeDetailsView = Marionette.View.extend({
    className: 'descriptor-type-details-format',
    template: "<div></div>",

    initialize: function () {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function () {
    },

    getFormat: function () {
        return {}
    }
});

module.exports = CountryType;
