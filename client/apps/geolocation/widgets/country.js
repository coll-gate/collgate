/**
 * Created by mboulnemour on 23/02/17.
 */

var DescriptorFormatType = require('../../descriptor/widgets/descriptorformattype');
var Marionette = require('backbone.marionette');

var CountryType = function() {
    DescriptorFormatType.call(this);

    this.name = "country";
    this.group = "country";
};

_.extend(CountryType.prototype, DescriptorFormatType.prototype, {
    create: function (format, parent, readOnly) {
        readOnly || (readOnly = false);

        if (readOnly) {

            var input = this._createStdInput(parent, "glyphicon-map-marker");

            this.parent = parent;
            this.readOnly = true;
            this.el = input;

        } else {
            var select = $('<select style="width: 100%;"></select>');
            parent.append(select);

            // init the autocomplete
            var url = application.baseUrl + 'geolocation/country/search';
            var initials = [];

            var container = parent.closest('div.modal-dialog').parent();
            if (container.length == 0) {
                container = parent.closest('div.panel');
            }

            var params = {
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

                        var results = [];

                        for (var i = 0; i < data.items.length; ++i) {

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
                placeholder: gt.gettext("Enter a value. 3 characters at least for auto-completion")
            };

            select.select2(params);

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

        if (this.readOnly && defaultValues) {
            $.ajax({
                type: "GET",
                url: application.baseUrl + 'geolocation/country/' + defaultValues + '/',
                dataType: 'json'
            }).done(function (data) {

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

                type.el.val(display);
            });
        } else {
            if (definesValues) {

                // need to re-init the select2 widget
                this.el.select2('destroy');

                // init the autocomplete
                var url = application.baseUrl + 'geolocation/country/';
                var initials = [];

                var container = this.parent.closest('div.modal-dialog').parent();
                if (container.length == 0) {
                    container = this.parent.closest('div.panel');
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
                    placeholder: gt.gettext("Enter a value. 3 characters at least for auto-completion")
                };



                // autoselect the initial value
                $.ajax({
                    type: "GET",
                    url: url + defaultValues + '/',
                    dataType: 'json'
                }).done(function (data) {

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

                    initials.push({id: data.id, text: display});

                    params.data = initials;

                    type.el.select2(params);
                    type.el.val(defaultValues).trigger('change');
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

module.exports = CountryType;