/**
 * @file descriptormodeladd.js
 * @brief Add a group of descriptors
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-08-05
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'div',
    className: 'descriptor-model-add',
    template: require('../templates/descriptormodeladd.html'),

    ui: {
        add_descriptor_model_btn: 'span.add-descriptor-model',
        add_descriptor_model_name: 'input.descriptor-model-name',
    },

    events: {
        'click @ui.add_descriptor_model_btn': 'addDescriptorModel',
        'input @ui.add_descriptor_model_name': 'onDescriptorModelNameInput',
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    addDescriptorModel: function() {
        if (this.validateGroupName()) {
            this.collection.create({name: this.ui.add_descriptor_model_name.val()}, {wait: true});
            $(this.ui.add_descriptor_model_name).cleanField();
        }
    },

    validateGroupName: function() {
        var v = this.ui.add_descriptor_model_name.val();
        var re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.add_descriptor_model_name).validateField('failed', gt.gettext("Invalid characters (alphanumeric, _ and - only)"));
            return false;
        } else if (v.length < 3) {
            $(this.ui.add_descriptor_model_name).validateField('failed', gt.ngettext('characters_min', 'characters_min', {count: 3}));
            return false;
        }

        return true;
    },

    onDescriptorModelNameInput: function() {
        if (this.validateGroupName()) {
            $.ajax({
                type: "GET",
                url: application.baseUrl + 'descriptor/model/search/',
                dataType: 'json',
                data: {filters: JSON.stringify({
                    method: 'ieq',
                    fields: 'name',
                    name: this.ui.add_descriptor_model_name.val()})
                },
                el: this.ui.add_descriptor_model_name,
                success: function(data) {
                    if (data.items.length > 0) {
                        for (var i in data.items) {
                            var t = data.items[i];

                            if (t.name.toUpperCase() == this.el.val().toUpperCase()) {
                                $(this.el).validateField('failed', gt.gettext('Name for model of descriptor already in usage'));
                                break;
                            }
                        }
                    } else {
                        $(this.el).validateField('ok');
                    }
                }
            });
        }
    }
});

module.exports = View;
