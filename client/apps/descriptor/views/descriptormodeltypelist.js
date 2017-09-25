/**
 * @file descriptormodeltypelist.js
 * @brief List of type of model of descriptors for a model model of descriptor view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-09-28
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var ScrollView = require('../../main/views/scroll');
var Dialog = require('../../main/views/dialog');
var DescriptorModelTypeView = require('../views/descriptormodeltype');

var View = ScrollView.extend({
    template: require("../templates/descriptormodeltypelist.html"),
    className: "object descriptor-model-type-list advanced-table-container",
    childView: DescriptorModelTypeView,
    childViewContainer: 'tbody.descriptor-model-type-list',

    attributes: {
        style: "padding-bottom: 15px;"
    },

    ui: {
      'body': 'div.table-advanced-body'
    },

    events: {
        "dragenter @ui.body": "dragEnterContent",
        "dragleave @ui.body" : "dragLeaveContent",
        "dragover @ui.body": "dragOverContent",
        "drop @ui.body": "dropContent"
    },

    childViewOptions: function () {
        return {
            descriptor_type_groups: this.getOption('descriptor_type_groups')
        }
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this);

        options || (options = {});

        this.listenTo(this.collection, 'reset', this.render, this);
    },

    dragEnterContent: function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        if (!$(e.target).hasClass("table-advanced-body")) {
            return false;
        }

        this.dragEnterCount || (this.dragEnterCount = 0);
        ++this.dragEnterCount;

        if (!application.main.dnd.hasView('descriptor-type descriptor-model-type')) {
            return false;
        }

        if (this.dragEnterCount === 1) {
            if (this.$el.find("tbody tr").length === 0) {
                this.$el.find("thead tr th").css('border-bottom', '5px dashed #ddd');
            }

            this.$el.find("tbody tr").last().css('border-bottom', '5px dashed #ddd');
        }

        return false;
    },

    dragLeaveContent: function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        if (!$(e.target).hasClass("table-advanced-body")) {
            return false;
        }

        this.dragEnterCount || (this.dragEnterCount = 1);
        --this.dragEnterCount;

        if (!application.main.dnd.hasView('descriptor-type descriptor-model-type')) {
            return false;
        }

        if (this.dragEnterCount === 0) {
            this.$el.find("tbody tr").last().css('border-bottom', 'initial');
            this.$el.find("thead tr th").css('border-bottom', 'initial');

        }

        return false;
    },

    dragOverContent: function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        if (!$(e.target).hasClass("table-advanced-body")) {
            return false;
        }

        this.dragEnterCount || (this.dragEnterCount = 1);

        if (!application.main.dnd.hasView('descriptor-type descriptor-model-type')) {
            return false;
        }

        if (this.dragEnterCount === 1) {
            if (this.$el.find("tbody tr").length === 0) {
                this.$el.find("thead tr th").css('border-bottom', '5px dashed #ddd');
            }

            this.$el.find("tbody tr").last().css('border-bottom', '5px dashed #ddd');
        }

        //e.dataTransfer.dropEffect = 'move';
        return false;
    },

    dropContent: function (e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        if (!$(e.target).hasClass("table-advanced-body")) {
            return false;
        }

        this.dragEnterCount = 0;

        if (!application.main.dnd.hasView('descriptor-type descriptor-model-type')) {
            return false;
        }

        this.$el.find("tbody tr").last().css('border-bottom', 'initial');
        this.$el.find("thead tr th").css('border-bottom', 'initial');

        var elt = application.main.dnd.get();
        if (elt.$el.hasClass('descriptor-type')) {
            var code = elt.model.get('code');

            var DefinesLabel = Dialog.extend({
                template: require('../templates/descriptormodeltypecreate.html'),

                attributes: {
                    id: "dlg_define_label"
                },

                ui: {
                    name: "#descriptor_model_type_name",
                    label: "#descriptor_model_type_label"
                },

                events: {
                    'input @ui.name': 'onNameInput',
                    'input @ui.label': 'onLabelInput'
                },

                initialize: function (options) {
                    DefinesLabel.__super__.initialize.apply(this);
                },

                onLabelInput: function () {
                    this.validateLabel();
                },

                validateLabel: function() {
                    var v = this.ui.label.val();

                    if (v.length < 3) {
                        $(this.ui.label).validateField('failed', _t('characters_min', {count: 3}));
                        return false;
                    }

                    $(this.ui.label).validateField('ok');

                    return true;
                },

                onNameInput: function () {
                    this.validateName();
                },

                validateName: function() {
                    var v = this.ui.name.val();
                    var re = /^[a-zA-Z0-9_\-]+$/i;

                    if (v.length > 0 && !re.test(v)) {
                        $(this.ui.name).validateField('failed', _t("Invalid characters (alphanumeric, _ and - only)"));
                        return false;
                    } else if (v.length < 3) {
                        $(this.ui.name).validateField('failed', _t('characters_min', {count: 3}));
                        return false;
                    }

                    $(this.ui.name).validateField('ok');

                    return true;
                },

                onApply: function() {
                    var view = this;
                    var collection = this.getOption('collection');
                    var position = this.getOption('position');
                    var code = this.getOption('code');

                    if (this.validateName() && this.validateLabel()) {
                        var to_rshift = [];

                        // server will r-shift position of any model upward this new
                        // do it locally to be consistent
                        for (var model in collection.models) {
                            var dmt = collection.models[model];
                            var p = dmt.get('position');
                            if (p >= position) {
                                dmt.set('position', p+1);
                                to_rshift.push(dmt);
                            }
                        }

                        collection.create({
                            descriptor_type_code: code,
                            name: this.ui.name.val(),
                            label: this.ui.label.val(),
                            position: position
                        }, {
                            wait: true,
                            success: function () {
                                view.destroy();
                            },
                            error: function () {
                                $.alert.error(_t("Unable to create the type of model of descriptor !"));

                                // left shift (undo) for consistency with server
                                for (var i = 0; i < to_rshift.length; ++i) {
                                    to_rshift[i].set('position', to_rshift[i].get('position')-1);
                                }
                            }
                        });
                    }
                }
            });

            var collection = this.collection;

            // find last position + 1
            var newPosition = 0;

            if (collection.models.length > 0) {
                newPosition = collection.at(collection.models.length-1).get('position') + 1;
            }

            var definesLabel = new DefinesLabel({
                collection: collection,
                position: newPosition,
                code: elt.model.get('code')
            });

            definesLabel.render();
        } else if (elt.$el.hasClass('descriptor-model-type')) {
            var collection = this.collection;
            var modelId = collection.model_id;

            // find last position + 1
            var newPosition = collection.at(collection.models.length-1).get('position') + 1;

            $.ajax({
                type: "PUT",
                url: application.baseUrl + 'descriptor/model/' + modelId + '/order/',
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    descriptor_model_type_id: elt.model.get('id'),
                    position: newPosition
                })
            }).done(function() {
                elt.model.set('position', newPosition);

                // lshift any others element
                for (var model in collection.models) {
                    var dmt = collection.models[model];
                    if (dmt.get('id') != elt.model.get('id')) {
                        var p = dmt.get('position');
                        dmt.set('position', p - 1);
                    }
                }

                // need to sort
                collection.sort();
            }).fail(function() {
                $.alert.error(_t('Unable to reorder the types of model of descriptor'));
            });
        }

        return false;
    }
});

module.exports = View;
