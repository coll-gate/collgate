/**
 * @file city.js
 * @brief Geolocation city widget
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-02-23
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescriptorFormatType = require('../../descriptor/widgets/descriptorformattype');
let Marionette = require('backbone.marionette');

let CityType = function () {
    DescriptorFormatType.call(this);

    this.name = "city";
    this.group = "city";
    this.allow_multiple = true
};

_.extend(CityType.prototype, DescriptorFormatType.prototype, {
    create: function (format, parent, options) {
        options || (options = {
            readOnly: false,
            history: false,
            multiple: false,
            extended_search: true
        });

        if (options.readOnly) {
            let input = this._createStdInput(parent, "fa-map-signs", options.history);

            this.parent = parent;
            this.readOnly = true;
            this.el = input;

        } else if (options.extended_search === false) {
            let select = $('<select style="width: 100%;" ' + (options.multiple ? "multiple" : "") + '></select>');
            parent.append(select);
            this.groupEl = this._createInputGroup(parent, "fa-map-signs", select, options.history);

            // init the autocomplete
            let url = window.application.url(['geolocation', 'city', 'search']);
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
        } else {
            let select = $('<select style="width: 100%;"></select>');
            parent.append(select);
            this.groupEl = this._createInputGroup(parent, "fa-map-signs", select, options.history);

            // init the autocomplete
            let url = window.application.url('geolocation');
            let initials = [];

            let container = parent.closest('div.modal-dialog').parent();
            if (container.length === 0) {
                container = this.groupEl;  // parent.closest('div.panel');
            }

            let default_option = null;

            let old_term = '';

            // Change display for the special option "Extend search"
            let formatOption = function (option) {
                if (option.id === 'more') {
                    return $('<span class="text-info">' + _t("Extended search...") + '</span>');
                }
                return option.text
            };

            let selectAjax = function (live_mode) {

                if (live_mode) {
                    return {
                        url: url + 'city/live-search/',
                        dataType: 'json',
                        delay: 250,
                        data: function (params) {
                            params.term || (params.term = old_term);

                            if (old_term != params.term) {
                                old_term = params.term;
                                initSelect2(false, true);
                            }

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

                                let country_data = data.items[i].country;
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

                                if (country_data.preferred_names) {
                                    display += ', ' + country_data.preferred_names;
                                } else if (country_data.short_names) {
                                    display += ', ' + country_data.short_names;
                                } else if (country_data.display_names) {
                                    display += ', ' + country_data.display_names;
                                } else {
                                    display += ', ' + country_data.name;
                                }

                                results.push({
                                    id: data.items[i].geoname_id,
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
                    }
                }

                return {
                    url: url + 'city/search/',
                    dataType: 'json',
                    delay: 250,
                    data: function (params) {
                        params.term || (params.term = old_term);

                        old_term = params.term;

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
                            let country_data = data.items[i].country;
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

                            if (country_data.preferred_names) {
                                display += ', ' + country_data.preferred_names;
                            } else if (country_data.short_names) {
                                display += ', ' + country_data.short_names;
                            } else if (country_data.display_names) {
                                display += ', ' + country_data.display_names;
                            } else {
                                display += ', ' + country_data.name;
                            }

                            results.push({
                                id: data.items[i].id,
                                text: display
                            });

                        }

                        if (params.next == null) {
                            results.push({
                                id: 'more',
                                text: 'Extended Search'
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
                }
            };

            let params = {
                // width: 'element',
                data: initials,
                dropdownParent: container,
                ajax: selectAjax(false),
                allowClear: true,
                minimumInputLength: 1,
                templateResult: formatOption,
                placeholder: _t("Enter a value.")
            };

            let initSelect2 = function (ajx_mode, reset_mode) {
                ajx_mode = ajx_mode || false;
                reset_mode = reset_mode || false;

                if (select.data('select2')) {
                    select.select2('destroy');
                }
                if (!ajx_mode) {
                    if (reset_mode) {
                        // initials.push(default_option);
                        params.data = initials;
                        params.ajax = selectAjax(false);
                        select.select2(params).fixSelect2Position();
                        select.val(default_option).trigger('change.select2');
                    } else {
                        params.ajax = selectAjax(false);
                        select.select2(params).fixSelect2Position();
                    }
                    select.unbind('select2:change');
                    select.unbind('select2:close');
                    select.unbind('select2:select');

                    select.on('select2:select', function () {
                        if (select.select2('val') === 'more') {
                            initSelect2(true);
                        }
                    });
                }
                else {
                    params.ajax = selectAjax(true);
                    select.select2(params).fixSelect2Position();
                    select.on('change.select2', function () {
                        // Add the webservice city to the local database
                        if (select.val()) {
                            select.unbind('select2:close');
                            $.ajax({
                                type: "POST",
                                url: url + 'city/',
                                dataType: 'json',
                                data: {
                                    'external_id': select.val()
                                }
                            }).done(function (data) {
                                let country_data = data.country;
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

                                if (country_data.preferred_names) {
                                    display += ', ' + country_data.preferred_names;
                                } else if (country_data.short_names) {
                                    display += ', ' + country_data.short_names;
                                } else if (country_data.display_names) {
                                    display += ', ' + country_data.display_names;
                                } else {
                                    display += ', ' + country_data.name;
                                }
                                initials.push({
                                    id: data.id,
                                    text: display
                                });
                                params.data = initials;
                                params.ajax = selectAjax(false);
                                select.select2(params).fixSelect2Position();
                                select.on('select2:select', function () {
                                    if (select.select2('val') == 'more') {
                                        initSelect2(true);
                                    }
                                });
                                select.val(data.id).trigger('change');
                                select.unbind('select2:change');
                            });
                        }
                    });
                    select.on('select2:close', function () {
                        old_term = "";
                        initSelect2(false, true);
                    });
                }
                if (old_term) {
                    let $search = select.data('select2').dropdown.$search || select.data('select2').selection.$search;
                    select.val(null).trigger('change');
                    $search.val(old_term).trigger('keyup');
                }
            };
            initSelect2(false);
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
            if (definesValues) {
                // defines value as attribute
                this.el.attr('value', defaultValues);

                $.ajax({
                    type: "GET",
                    url: window.application.url(['geolocation', 'city', defaultValues]),
                    dataType: 'json'
                }).done(function (data) {
                    let country_data = data.country;
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

                    if (country_data.preferred_names) {
                        display += ', ' + country_data.preferred_names;
                    } else if (country_data.short_names) {
                        display += ', ' + country_data.short_names;
                    } else if (country_data.display_names) {
                        display += ', ' + country_data.display_names;
                    } else {
                        display += ', ' + country_data.name;
                    }

                    type.el.val(display);
                });
            } else {
                this.el.attr('value', "").el.val("");
            }
        } else {
            if (definesValues) {
                // defines value as attribute
                this.el.attr('value', defaultValues);

                let select = this.el;

                // init the autocomplete
                let url = window.application.url('geolocation');
                let initials = [];

                let container = this.parent.closest('div.modal-dialog').parent();
                if (container.length === 0) {
                    container = this.groupEl;  // parent.closest('div.panel');
                }

                let default_option = null;
                let old_term = '';

                // Change display for the special option "Extend search"
                let formatOption = function (option) {
                    if (option.id === 'more') {
                        return $('<span class="text-info">' + _t("Extended search...") + '</span>');
                    }
                    return option.text
                };

                let selectAjax = function (live_mode) {
                    if (live_mode) {
                        return {
                            url: url + 'city/live-search/',
                            dataType: 'json',
                            delay: 250,
                            data: function (params) {
                                params.term || (params.term = old_term);

                                if (old_term != params.term) {
                                    old_term = params.term;
                                    initSelect2(false, true);
                                }

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

                                    let country_data = data.items[i].country;
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

                                    if (country_data.preferred_names) {
                                        display += ', ' + country_data.preferred_names;
                                    } else if (country_data.short_names) {
                                        display += ', ' + country_data.short_names;
                                    } else if (country_data.display_names) {
                                        display += ', ' + country_data.display_names;
                                    } else {
                                        display += ', ' + country_data.name;
                                    }

                                    results.push({
                                        id: data.items[i].geoname_id,
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
                        }
                    }
                    return {
                        url: url + 'city/search/',
                        dataType: 'json',
                        delay: 250,
                        data: function (params) {
                            params.term || (params.term = old_term);

                            old_term = params.term;

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

                                let country_data = data.items[i].country;
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

                                if (country_data.preferred_names) {
                                    display += ', ' + country_data.preferred_names;
                                } else if (country_data.short_names) {
                                    display += ', ' + country_data.short_names;
                                } else if (country_data.display_names) {
                                    display += ', ' + country_data.display_names;
                                } else {
                                    display += ', ' + country_data.name;
                                }

                                results.push({
                                    id: data.items[i].id,
                                    text: display
                                });

                            }

                            if (params.next == null) {
                                results.push({
                                    id: 'more',
                                    text: 'Extended Search'
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
                    }
                };

                let params = {
                    data: initials,
                    dropdownParent: container,
                    ajax: selectAjax(false),
                    allowClear: true,
                    minimumInputLength: 1,
                    templateResult: formatOption,
                    placeholder: _t("Enter a value.")
                };

                let initSelect2 = function (ajx_mode, reset_mode) {
                    ajx_mode = ajx_mode || false;
                    reset_mode = reset_mode || false;

                    if (select.data('select2')) {
                        select.select2('destroy');
                    }

                    if (!ajx_mode) {
                        if (reset_mode) {
                            // initials.push(default_option);
                            params.data = initials;
                            params.ajax = selectAjax(false);
                            select.select2(params).fixSelect2Position();
                            select.val(default_option.id).trigger('change.select2');
                        } else {
                            params.ajax = selectAjax(false);
                            select.select2(params).fixSelect2Position();
                        }
                        select.unbind('select2:change');
                        select.unbind('select2:close');
                        select.unbind('select2:select');

                        select.on('select2:select', function () {
                            if (select.select2('val') === 'more') {
                                initSelect2(true);
                            }
                        });

                    }
                    else {
                        params.ajax = selectAjax(true);
                        select.select2(params).fixSelect2Position();
                        select.on('change.select2', function () {
                                // Add the webservice city to the local database

                                if (select.val()) {
                                    select.unbind('select2:close');
                                    $.ajax({
                                        type: "POST",
                                        url: url + 'city/',
                                        dataType: 'json',
                                        data: {
                                            'external_id': select.val()
                                        }
                                    }).done(function (data) {

                                        let country_data = data.country;
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

                                        if (country_data.preferred_names) {
                                            display += ', ' + country_data.preferred_names;
                                        } else if (country_data.short_names) {
                                            display += ', ' + country_data.short_names;
                                        } else if (country_data.display_names) {
                                            display += ', ' + country_data.display_names;
                                        } else {
                                            display += ', ' + country_data.name;
                                        }

                                        initials.push({
                                            id: data.id,
                                            text: display
                                        });

                                        params.data = initials;
                                        params.ajax = selectAjax(false);
                                        select.select2(params).fixSelect2Position();
                                        select.on('select2:select', function () {
                                            if (select.select2('val') === 'more') {
                                                initSelect2(true);
                                            }
                                        });
                                        select.val(data.id).trigger('change');
                                        select.unbind('select2:change');
                                    });
                                }
                            }
                        );
                        select.on('select2:close', function () {
                            old_term = "";
                            initSelect2(false, true);
                        });
                    }
                    if (old_term) {
                        let $search = select.data('select2').dropdown.$search || select.data('select2').selection.$search;
                        select.val(null).trigger('change');
                        $search.val(old_term).trigger('keyup');
                    }
                };

                // autoselect the initial value
                $.ajax({
                    type: "GET",
                    url: url + 'city/' + defaultValues + '/',
                    dataType: 'json'
                }).done(function (data) {
                    let country_data = data.country;
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

                    if (country_data.preferred_names) {
                        display += ', ' + country_data.preferred_names;
                    } else if (country_data.short_names) {
                        display += ', ' + country_data.short_names;
                    } else if (country_data.display_names) {
                        display += ', ' + country_data.display_names;
                    } else {
                        display += ', ' + country_data.name;
                    }

                    default_option = {
                        id: data.id,
                        text: display
                    };

                    initials.push(default_option);
                    params.data = initials;
                    params.ajax = selectAjax(false);
                    select.select2(params).fixSelect2Position();
                    select.on('select2:select', function () {
                        if (select.select2('val') === 'more') {
                            initSelect2(true);
                        }
                    });
                    select.val(defaultValues).trigger('change.select2');

                    // remove temporary value
                    select.removeAttr('value');
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

CityType.DescriptorTypeDetailsView = Marionette.View.extend({
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

module.exports = CityType;
