/**
 * @file descriptorpanellist.js
 * @brief List of panel of model of descriptors for a meta-model of descriptor view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var AdvancedTable = require('../../main/views/advancedtable');
var Dialog = require('../../main/views/dialog');

var DescriptorPanelView = require('../views/descriptorpanel');

var View = AdvancedTable.extend({
    template: require("../templates/descriptorpanellist.html"),
    childView: DescriptorPanelView,
    childViewContainer: 'div.descriptor-panel-list',

    attributes: {
        style: "height: 100%; display: flex; flex-direction: column;"
    },

    ui: {
        'panels_list': 'div.panels-list',
        'top_placeholder': 'div.top-placeholder',
        'bottom_placeholder': 'div.bottom-placeholder'
    },

    events: {
        "dragenter @ui.panels_list": "dragEnterContent",
        "dragleave @ui.panels_list" : "dragLeaveContent",
        "dragover @ui.panels_list": "dragOverContent",
        "drop @ui.panels_list": "dropContent"
    },

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    },

    dragEnterContent: function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        this.dragEnterCount || (this.dragEnterCount = 0);
        ++this.dragEnterCount;

        if (!application.main.dnd.hasView('descriptor-model descriptor-panel')) {
            return false;
        }

        if (this.dragEnterCount === 1) {
            if (application.main.dnd.get().$el.hasClass('descriptor-model')) {
                this.ui.bottom_placeholder.css('display', 'block');
            } else if (application.main.dnd.get().$el.hasClass('descriptor-panel')) {
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

        if (!application.main.dnd.hasView('descriptor-model descriptor-panel')) {
            return false;
        }

        if (this.dragEnterCount === 0) {
            if (application.main.dnd.get().$el.hasClass('descriptor-model')) {
                this.ui.bottom_placeholder.css('display', 'none');
            } else if (application.main.dnd.get().$el.hasClass('descriptor-panel')) {
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

        if (!application.main.dnd.hasView('descriptor-model descriptor-panel')) {
            return false;
        }

        if (this.dragEnterCount === 1) {
            if (application.main.dnd.get().$el.hasClass('descriptor-model')) {
                this.ui.bottom_placeholder.css('display', 'block');
            } else if (application.main.dnd.get().$el.hasClass('descriptor-panel')) {
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

        if (!application.main.dnd.hasView('descriptor-model descriptor-panel')) {
            return false;
        }

        var elt = application.main.dnd.get();
        if (elt.$el.hasClass('descriptor-model')) {
            var DefinesLabel = Dialog.extend({
                template: require('../templates/descriptorpanelcreate.html'),

                attributes: {
                    id: "dlg_create_panel"
                },

                ui: {
                    label: "#label"
                },

                events: {
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
                                view.destroy();
                            },
                            error: function () {
                                view.destroy();

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
                url: window.application.url(['descriptor', 'meta-model', metaModelId, 'panel', 'order']),
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
                    if (dmt.get('id') !== elt.model.get('id')) {
                        var p = dmt.get('position');
                        dmt.set('position', p - 1);
                    }
                }

                // need to sort
                collection.sort();
            }).fail(function() {
                $.alert.error(_t('Unable to reorder the panels of descriptor'));
            });
        }

        return false;
    }
});

module.exports = View;
