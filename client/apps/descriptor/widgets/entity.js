/**
 * @file entity.js
 * @brief Display and manage an entity reference value format of type of descriptor
 * @author Frederic SCHERMA
 * @date 2017-01-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorFormatType = require('./descriptorformattype');

var Entity = function() {
    DescriptorFormatType.call(this);

    this.name = "entity";
    this.group = "single";
}

_.extend(Entity.prototype, DescriptorFormatType.prototype, {
    create: function(format, parent, readOnly, create) {
        readOnly || (readOnly = false);
        create || (create = true);

        this.owned = create;

        if (readOnly) {
            var input = null;

            if (create) {
                input = this._createStdInput(parent, "glyphicon-share");
            } else {
                input = parent.children('input');
            }

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            var select = $('<select style="width: 100%;"></select>');
            parent.append(select);

            // init the autocomplete
            var url = application.baseUrl + format.model.replace('.', '/') + '/';
            var initials = [];

            var params = {
                data: initials,
                dropdownParent: parent.parent(),  // $(view.el), @todo is parent works ??
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

            // autoselect the initial value
            if (definesValues) { // @todo @set
                var url = application.baseUrl + format.model.replace('.', '/') + '/';

                $.ajax({
                    type: "GET",
                    url: url + defaultValues[0] + '/',
                    dataType: 'json'
                }).done(function (data) {
                    initials.push({id: data.id, text: data.name});

                    params.data = initials;

                    select.select2(params);
                    select.val(defaultValues).trigger('change');
                });
            } else {
                // make an autocomplete widget on simple_value
                select.select2(params);
            }

            this.parent = parent;
            this.el = select;
        }
    },

    destroy: function() {
        if (this.el && this.parent && this.owned) {
            if (this.readOnly) {
                this.parent.remove(this.el.parent());
            } else {
                this.parent.remove(this.el);
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

        if (this.readOnly) {
            var url = application.baseUrl + format.model.replace('.', '/') + '/';
            var type = this;

            if (definesValues) {
                $.ajax({
                    type: "GET",
                    url: url + defaultValues[0] + '/',
                    dataType: 'json'
                }).done(function (data) {
                    type.el.val(data.name);
                });
            }
        } else {
            /* @todo WTF !? @see enumsingle::autocomplete */
        }
    },

    values: function() {
        if (this.el && this.parent) {
            return [this.el.val()];
        }
    }
});

module.exports = Entity;