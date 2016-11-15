/**
 * @file descriptorpanellist.js
 * @brief List of panel of model of descriptors for a meta-model of descriptor view
 * @author Frederic SCHERMA
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var ScrollView = require('../../main/views/scroll');
var Dialog = require('../../main/views/dialog');

var DescriptorPanelModel = require('../models/descriptorpanel');
var DescriptorPanelView = require('../views/descriptorpanel');

var View = ScrollView.extend({
    template: require("../templates/descriptorpanellist.html"),
    childView: DescriptorPanelView,
    childViewContainer: 'div.descriptor-panel-list',

    ui: {
        'top_placeholder': 'div.top-placeholder',
        'bottom_placeholder': 'div.bottom-placeholder',
    },

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);

        View.__super__.initialize.apply(this);

        $("div.left-content").on("dragenter", $.proxy(this.dragEnterContent, this));
        $("div.left-content").on("dragleave", $.proxy(this.dragLeaveContent, this));
        $("div.left-content").on("dragover", $.proxy(this.dragOverContent, this));
        $("div.left-content").on("drop", $.proxy(this.dropContent, this));
    },

    dragEnterContent: function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        this.dragEnterCount || (this.dragEnterCount = 0);
        ++this.dragEnterCount;

        if (this.dragEnterCount == 1) {
            if (application.dndElement.$el.hasClass('descriptor-model')) {
                this.ui.bottom_placeholder.css('display', 'block');
            }
        }

        return false;
    },

    dragLeaveContent: function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        this.dragEnterCount || (this.dragEnterCount = 1);
        --this.dragEnterCount;

        if (this.dragEnterCount == 0) {
            if (application.dndElement.$el.hasClass('descriptor-model')) {
                this.ui.bottom_placeholder.css('display', 'none');
            }
        }

        return false;
    },

    dragOverContent: function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        this.dragEnterCount || (this.dragEnterCount = 1);

        if (this.dragEnterCount == 1) {
            if (application.dndElement.$el.hasClass('descriptor-model')) {
                this.ui.bottom_placeholder.css('display', 'block');
            }
        }

        //e.dataTransfer.dropEffect = 'move';
        return false;
    },

    dropContent: function (e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        this.dragEnterCount = 0;

        this.ui.top_placeholder.css('display', 'none');
        this.ui.bottom_placeholder.css('display', 'none');

        var elt = application.dndElement;
        if (!elt) {
            return false;
        }

        if (elt.$el.hasClass('descriptor-model')) {
            var DefinesLabel = Dialog.extend({
                template: require('../templates/descriptorpanelcreate.html'),

                attributes: {
                    id: "dlg_create_panel",
                },

                ui: {
                    label: "#label",
                },

                events: {
                    'input @ui.label': 'onLabelInput',
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
                        $(this.ui.label).validateField('failed', gt.gettext('3 characters min'));
                        return false;
                    }

                    $(this.ui.label).validateField('ok');

                    return true;
                },

                onApply: function() {
                    var view = this;
                    var collection = this.getOption('collection');
                    var position = this.getOption('position');
                    var modelId = this.getOption('descriptor_model');

                    if (this.validateLabel()) {
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
                            descriptor_model: modelId,
                            label: this.ui.label.val(),
                            position: position
                        }, {
                            wait: true,
                            success: function () {
                                view.remove();
                            },
                            error: function () {
                                view.remove();

                                // left shift (undo) for consistency with server
                                for (var i = 0; i < to_rshift.length; ++i) {
                                    to_rshift[i].set('position', to_rshift[i].get('position')-1);
                                }
                            }
                        });
                    }
                },
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
                descriptor_model: elt.model.get('id')
            });

            definesLabel.render();
        } else if (elt.$el.hasClass('descriptor-panel')) {
            var collection = this.collection;
            var metaModelId = collection.model_id;

            // find last position + 1
            var newPosition = collection.at(collection.models.length-1).get('position') + 1;

            $.ajax({
                type: "PUT",
                url: application.baseUrl + 'descriptor/meta-model/' + metaModelId + '/panel/order/',
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    descriptor_panel_id: elt.model.get('id'),
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
                $.alert.error(gt.gettext('Unable to reorder the panels of descriptor'));
            });
        }

        return false;
    },
});

module.exports = View;