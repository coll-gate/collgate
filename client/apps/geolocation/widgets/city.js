/**
 * Created by mboulnemour on 23/02/17.
 */

var DescriptorFormatType = require('../../descriptor/widgets/descriptorformattype');
var Marionette = require('backbone.marionette');

var CityType = function() {
    DescriptorFormatType.call(this);

    this.name = "city";
    this.group = "city";
};

_.extend(CityType.prototype, DescriptorFormatType.prototype, {
    create: function (format, parent, readOnly) {
        readOnly || (readOnly = false);

        var old_term = '';

        // Change display for specials options (like more results option)
        formatOption = function(option) {
            if(option.id == 'more'){
                more_text = '<span class="text-info">' + gt.gettext("Extended search...") + '</span>';
                return $(more_text);
            }
            return option.text
        };

        if (readOnly) {

            var input = this._createStdInput(parent, "glyphicon-map-marker");

            this.parent = parent;
            this.readOnly = true;
            this.el = input;

        } else {
            var select = $('<select style="width: 100%;"></select>');
            parent.append(select);

            // init the autocomplete
            var url = application.baseUrl + 'geolocation/';
            var initials = [];

            var container = parent.closest('div.modal-dialog').parent();
            if (container.length == 0) {
                container = parent.closest('div.panel');
            }

            selectAjax = function(live_mode) {

                if(live_mode) {
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

                            var results = [];

                            for (var i = 0; i < data.items.length; ++i) {

                                country_data = data.items[i].country;

                                if (data.items[i].preferred_names) {
                                    display = data.items[i].preferred_names
                                }
                                else if (data.items[i].short_names) {
                                    display = data.items[i].short_names
                                }
                                else if (data.items[i].display_names) {
                                    display = data.items[i].display_names
                                }
                                else {
                                    display = data.items[i].name
                                }

                                if (country_data.preferred_names) {
                                    display += ', ' + country_data.preferred_names
                                }
                                else if (country_data.short_names) {
                                    display += ', ' + country_data.short_names
                                }
                                else if (country_data.display_names) {
                                    display += ', ' + country_data.display_names
                                }
                                else {
                                    display += ', ' + country_data.name
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

                        var results = [];

                        for (var i = 0; i < data.items.length; ++i) {

                            country_data = data.items[i].country;

                            if (data.items[i].preferred_names) {
                                display = data.items[i].preferred_names
                            }
                            else if (data.items[i].short_names) {
                                display = data.items[i].short_names
                            }
                            else if (data.items[i].display_names) {
                                display = data.items[i].display_names
                            }
                            else {
                                display = data.items[i].name
                            }

                            if (country_data.preferred_names) {
                                display += ', ' + country_data.preferred_names
                            }
                            else if (country_data.short_names) {
                                display += ', ' + country_data.short_names
                            }
                            else if (country_data.display_names) {
                                display += ', ' + country_data.display_names
                            }
                            else {
                                display += ', ' + country_data.name
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

            var params = {
                data: initials,
                dropdownParent: container,
                ajax: selectAjax(false),
                allowClear: true,
                minimumInputLength: 1,
                templateResult: formatOption,
                placeholder: gt.gettext("Enter a value. 3 characters at least for auto-completion")
            };

            var default_option = null;

            initSelect2 = function(ajx_mode, reset_mode) {
                live_mode = ajx_mode || false;
                reset_mode = reset_mode || false;

                if (select.data('select2')) {
                    select.select2('destroy');
                }

                if (!live_mode) {

                    if (reset_mode) {
                        // initials.push(default_option);
                        params.data = initials;
                        params.ajax = selectAjax(false);
                        select.select2(params);
                        select.val(default_option).trigger('change.select2');
                    } else {
                        params.ajax = selectAjax(false);
                        select.select2(params);
                    }
                    select.unbind('select2:change');
                    select.unbind('select2:close');
                    select.unbind('select2:select');

                    select.on('select2:select', function(){
                            if (select.select2('val') == 'more'){
                                initSelect2(true);
                            }
                        }
                    );

                }
                else {
                    params.ajax = selectAjax(true);
                    select.select2(params);
                    select.on('change.select2', function(){
                            // Add the webservice city to the local database

                            if (select.val()) {
                                select.unbind('select2:close');
                                $.ajax({
                                    type: "POST",
                                    url: url + 'city/',
                                    dataType: 'json',
                                    data: {
                                            'external_id' : select.val()
                                        }
                                }).done(function (data) {

                                    country_data = data.country;

                                    if (data.preferred_names) {
                                        display = data.preferred_names
                                    }
                                    else if (data.short_names) {
                                        display = data.short_names
                                    }
                                    else if (data.display_names) {
                                        display = data.display_names
                                    }
                                    else {
                                        display = data.name
                                    }

                                    if (country_data.preferred_names) {
                                        display += ', ' + country_data.preferred_names
                                    }
                                    else if (country_data.short_names) {
                                        display += ', ' + country_data.short_names
                                    }
                                    else if (country_data.display_names) {
                                        display += ', ' + country_data.display_names
                                    }
                                    else {
                                        display += ', ' + country_data.name
                                    }

                                    initials.push({
                                        id: data.id,
                                        text: display
                                    });

                                    params.data = initials;
                                    params.ajax = selectAjax(false);
                                    select.select2(params);
                                    select.on('select2:select', function(){
                                            if (select.select2('val') == 'more'){
                                                initSelect2(true);
                                            }
                                        }
                                    );

                                    select.val(data.id).trigger('change');
                                    select.unbind('select2:change');
                                });
                            }
                        }
                    );
                    select.on('select2:close', function(){
                            old_term = "";
                            initSelect2(false, true);
                        }
                    );
                }

                if (old_term) {
                    var $search = select.data('select2').dropdown.$search || select.data('select2').selection.$search;
                    select.val(null).trigger('change');

                    $search.val(old_term).trigger('keyup');
                }
            };

            initSelect2(false);

            this.parent = parent;
            this.el = select;
        }
    },

    destroy: function() {
        if (this.el && this.parent) {
            if (this.readOnly) {
                this.el.parent().remove();
            } else {
                this.el.select2('destroy');
                this.el.remove();
            }
        }
    },

    enable: function() {
        if (this.el) {
            this.el.prop("disabled", false);
        }
    },

    disable: function() {
        if (this.el) {
            this.el.prop("disabled", true);
        }
    },

    set: function (format, definesValues, defaultValues, descriptorTypeGroup, descriptorTypeId) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        var type = this;

        // Change display for specials options (like more results option)
        formatOption = function(option) {
            if(option.id == 'more'){
                more_text = '<span class="text-info">' + gt.gettext("Extended search...") + '</span>';
                return $(more_text);
            }
            return option.text
        };

        if (this.readOnly && defaultValues) {
            $.ajax({
                type: "GET",
                url: application.baseUrl + 'geolocation/city/' + defaultValues + '/',
                dataType: 'json'
            }).done(function (data) {

                country_data = data.country;

                if (data.preferred_names) {
                    display = data.preferred_names
                }
                else if (data.short_names) {
                    display = data.short_names
                }
                else if (data.display_names) {
                    display = data.display_names
                }
                else {
                    display = data.name
                }

                if (country_data.preferred_names) {
                    display += ', ' + country_data.preferred_names
                }
                else if (country_data.short_names) {
                    display += ', ' + country_data.short_names
                }
                else if (country_data.display_names) {
                    display += ', ' + country_data.display_names
                }
                else {
                    display += ', ' + country_data.name
                }

                type.el.val(display);
            });

        } else {
            if (definesValues) {

                var select = this.el;

                // init the autocomplete
                var url = application.baseUrl + 'geolocation/';
                var initials = [];

                var container = this.parent.closest('div.modal-dialog').parent();
                if (container.length == 0) {
                    container = this.parent.closest('div.panel');
                }

                selectAjax = function(live_mode) {

                    if(live_mode) {
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

                                var results = [];

                                for (var i = 0; i < data.items.length; ++i) {

                                    country_data = data.items[i].country;

                                    if (data.items[i].preferred_names) {
                                        display = data.items[i].preferred_names
                                    }
                                    else if (data.items[i].short_names) {
                                        display = data.items[i].short_names
                                    }
                                    else if (data.items[i].display_names) {
                                        display = data.items[i].display_names
                                    }
                                    else {
                                        display = data.items[i].name
                                    }

                                    if (country_data.preferred_names) {
                                        display += ', ' + country_data.preferred_names
                                    }
                                    else if (country_data.short_names) {
                                        display += ', ' + country_data.short_names
                                    }
                                    else if (country_data.display_names) {
                                        display += ', ' + country_data.display_names
                                    }
                                    else {
                                        display += ', ' + country_data.name
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

                            var results = [];

                            for (var i = 0; i < data.items.length; ++i) {

                                country_data = data.items[i].country;

                                if (data.items[i].preferred_names) {
                                    display = data.items[i].preferred_names
                                }
                                else if (data.items[i].short_names) {
                                    display = data.items[i].short_names
                                }
                                else if (data.items[i].display_names) {
                                    display = data.items[i].display_names
                                }
                                else {
                                    display = data.items[i].name
                                }

                                if (country_data.preferred_names) {
                                    display += ', ' + country_data.preferred_names
                                }
                                else if (country_data.short_names) {
                                    display += ', ' + country_data.short_names
                                }
                                else if (country_data.display_names) {
                                    display += ', ' + country_data.display_names
                                }
                                else {
                                    display += ', ' + country_data.name
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

                var params = {
                    data: initials,
                    dropdownParent: container,
                    ajax: selectAjax(false),
                    allowClear: true,
                    minimumInputLength: 1,
                    templateResult: formatOption,
                    placeholder: gt.gettext("Enter a value. 3 characters at least for auto-completion")
                };

                var default_option = null;

                initSelect2 = function(ajx_mode, reset_mode) {
                    live_mode = ajx_mode || false;
                    reset_mode = reset_mode || false;

                    if (select.data('select2')) {
                        select.select2('destroy');
                    }

                    if (!live_mode) {

                        if (reset_mode) {
                            // initials.push(default_option);
                            params.data = initials;
                            params.ajax = selectAjax(false);
                            select.select2(params);
                            select.val(default_option.id).trigger('change.select2');
                        } else {
                            params.ajax = selectAjax(false);
                            select.select2(params);
                        }
                        select.unbind('select2:change');
                        select.unbind('select2:close');
                        select.unbind('select2:select');

                        select.on('select2:select', function(){
                                if (select.select2('val') == 'more'){
                                    initSelect2(true);
                                }
                            }
                        );

                    }
                    else {
                        params.ajax = selectAjax(true);
                        select.select2(params);
                        select.on('change.select2', function(){
                                // Add the webservice city to the local database

                                if (select.val()) {
                                    select.unbind('select2:close');
                                    $.ajax({
                                        type: "POST",
                                        url: url + 'city/',
                                        dataType: 'json',
                                        data: {
                                                'external_id' : select.val()
                                            }
                                    }).done(function (data) {

                                        country_data = data.country;

                                        if (data.preferred_names) {
                                            display = data.preferred_names
                                        }
                                        else if (data.short_names) {
                                            display = data.short_names
                                        }
                                        else if (data.display_names) {
                                            display = data.display_names
                                        }
                                        else {
                                            display = data.name
                                        }

                                        if (country_data.preferred_names) {
                                            display += ', ' + country_data.preferred_names
                                        }
                                        else if (country_data.short_names) {
                                            display += ', ' + country_data.short_names
                                        }
                                        else if (country_data.display_names) {
                                            display += ', ' + country_data.display_names
                                        }
                                        else {
                                            display += ', ' + country_data.name
                                        }

                                        initials.push({
                                            id: data.id,
                                            text: display
                                        });

                                        params.data = initials;
                                        params.ajax = selectAjax(false);
                                        select.select2(params);
                                        select.on('select2:select', function(){
                                                if (select.select2('val') == 'more'){
                                                    initSelect2(true);
                                                }
                                            }
                                        );

                                        select.val(data.id).trigger('change');
                                        select.unbind('select2:change');
                                    });
                                }
                            }
                        );
                        select.on('select2:close', function(){
                                old_term = "";
                                initSelect2(false, true);
                            }
                        );
                    }

                    if (old_term) {
                        var $search = select.data('select2').dropdown.$search || select.data('select2').selection.$search;
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

                    country_data = data.country;

                    if (data.preferred_names) {
                        display = data.preferred_names
                    }
                    else if (data.short_names) {
                        display = data.short_names
                    }
                    else if (data.display_names) {
                        display = data.display_names
                    }
                    else {
                        display = data.name
                    }

                    if (country_data.preferred_names) {
                        display += ', ' + country_data.preferred_names
                    }
                    else if (country_data.short_names) {
                        display += ', ' + country_data.short_names
                    }
                    else if (country_data.display_names) {
                        display += ', ' + country_data.display_names
                    }
                    else {
                        display += ', ' + country_data.name
                    }

                    default_option = {
                        id: data.id,
                        text: display
                    };

                    initials.push(default_option);
                    params.data = initials;
                    params.ajax = selectAjax(false);
                    select.select2(params);
                    select.on('select2:select', function(){
                            if (select.select2('val') == 'more'){
                                initSelect2(true);
                            }
                        }
                    );

                    select.val(defaultValues).trigger('change.select2');
                });
            }
        }
    },

    values: function() {
        if (this.el && this.parent) {
            if (this.el.val() !== "") {
                var value = parseInt(this.el.val());
                return isNaN(value) ? null : value;
            } else {
                return null;
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

module.exports = CityType;