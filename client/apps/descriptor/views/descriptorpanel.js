/**
 * @file descriptorpanel.js
 * @brief Panel of model of descriptor item view
 * @author Frederic SCHERMA
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var Dialog = require('../../main/views/dialog');
var DescriptorPanelModel = require('../models/descriptorpanel');


var View = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'object descriptor-panel',
    template: require('../templates/descriptorpanel.html'),

    attributes: {
        draggable: true,
    },

    ui: {
        'delete_descriptor_panel': 'span.delete-descriptor-panel',
        'label': 'span.change-label',
        'top_placeholder': 'div.top-placeholder',
        'bottom_placeholder': 'div.bottom-placeholder',
    },

    events: {
        'dragstart': 'dragStart',
        'dragend': 'dragEnd',
        'dragover': 'dragOver',
        'dragenter': 'dragEnter',
        'dragleave': 'dragLeave',
        'drop': 'drop',
        'click @ui.delete_descriptor_panel': 'deleteDescriptorPanel',
        'click @ui.label': 'editLabel',
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        if (!session.user.isStaff && !session.user.isSuperUser) {
            $(this.ui.delete_descriptor_panel).hide();
        }
    },

    dragStart: function(e) {
        // fix for firefox...
        e.originalEvent.dataTransfer.setData('text/plain', null);

        this.$el.css('opacity', '0.4');
        application.dndElement = this;
    },

    dragEnd: function(e) {
        this.$el.css('opacity', '1.0');
        application.dndElement = null;
    },

    dragEnter: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        this.dragEnterCount || (this.dragEnterCount = 0);
        ++this.dragEnterCount;

        if (this.dragEnterCount == 1) {
            if (application.dndElement.$el.hasClass('descriptor-panel')) {
                if (this.model.get('position') < application.dndElement.model.get('position')) {
                    this.ui.top_placeholder.css('display', 'block');
                } else if (this.model.get('position') > application.dndElement.model.get('position')) {
                    this.ui.bottom_placeholder.css('display', 'block');
                }
            } else if (application.dndElement.$el.hasClass('descriptor-model')) {
                this.ui.top_placeholder.css('display', 'block');
            }
        }

        return false;
    },

    dragLeave: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        this.dragEnterCount || (this.dragEnterCount = 1);
        --this.dragEnterCount;

        if (this.dragEnterCount == 0) {
            if (application.dndElement.$el.hasClass('descriptor-panel')) {
                if (this.model.get('position') < application.dndElement.model.get('position')) {
                    this.ui.top_placeholder.css('display', 'none');
                } else if (this.model.get('position') > application.dndElement.model.get('position')) {
                    this.ui.bottom_placeholder.css('display', 'none');
                }
            } else if (application.dndElement.$el.hasClass('descriptor-model')) {
                this.ui.top_placeholder.css('display', 'none');
            }
        }

        return false;
    },

    dragOver: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        this.dragEnterCount || (this.dragEnterCount = 1);

        if (this.dragEnterCount == 1) {
            if (application.dndElement.$el.hasClass('descriptor-panel')) {
                if (this.model.get('position') < application.dndElement.model.get('position')) {
                    this.ui.top_placeholder.css('display', 'block');
                } else if (this.model.get('position') > application.dndElement.model.get('position')) {
                    this.ui.bottom_placeholder.css('display', 'block');
                }
            } else if (application.dndElement.$el.hasClass('descriptor-model')) {
                this.ui.top_placeholder.css('display', 'block');
            }
        }

        //e.originalEvent.dataTransfer.dropEffect = 'move';
        return false;
    },

    drop: function (e) {
        if (e.originalEvent.stopPropagation) {
            e.originalEvent.stopPropagation();
        }

        var elt = application.dndElement;
        this.dragEnterCount = 0;

        if (elt.$el.hasClass('descriptor-model')) {
            // reset placeholders
            this.ui.top_placeholder.css('display', 'none');
            this.ui.bottom_placeholder.css('display', 'none');

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
                    var descriptor_model = this.getOption('descriptor_model');

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
                            descriptor_model: descriptor_model,
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
                },
            });

            var definesLabel = new DefinesLabel({
                collection: this.model.collection,
                position: this.model.get('position'),
                descriptor_model: elt.model.get('id')
            });

            definesLabel.render();
        }
        else if (elt.$el.hasClass('descriptor-panel')) {
            // useless drop on himself
            if (this == elt) {
                return false;
            }

            // reset placeholder
            this.ui.top_placeholder.css('display', 'none');
            this.ui.bottom_placeholder.css('display', 'none');

            // ajax call
            var position = elt.model.get('position');
            var newPosition = this.model.get('position');
            var modelId = this.model.collection.model_id;
            var collection = this.model.collection;

            $.ajax({
                type: "PUT",
                url: application.baseUrl + 'descriptor/meta-model/' + modelId + '/panel/order/',
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    descriptor_panel_id: elt.model.get('id'),
                    position: newPosition
                })
            }).done(function() {
                // server will shift position of any model upward/downward this model
                // do it locally to be consistent
                // so that we don't need to collection.fetch({update: true, remove: true});
                if (newPosition < position) {
                    var to_rshift = [];

                    for (var model in collection.models) {
                        var dmt = collection.models[model];
                        if (dmt.get('id') != elt.model.get('id')) {
                            if (dmt.get('position') >= newPosition) {
                                to_rshift.push(dmt);
                            }
                        }
                    }

                    elt.model.set('position', newPosition);

                    var nextPosition = newPosition + 1;

                    for (var i = 0; i < to_rshift.length; ++i) {
                        to_rshift[i].set('position', nextPosition);
                        ++nextPosition;
                    }
                } else {
                    var to_lshift = [];

                    for (var model in collection.models) {
                        var dmt = collection.models[model];
                        if (dmt.get('id') != elt.model.get('id')) {
                            if (dmt.get('position') <= newPosition) {
                                to_lshift.push(dmt);
                            }
                        }
                    }

                    elt.model.set('position', newPosition);

                    var nextPosition = 0;

                    for (var i = 0; i < to_lshift.length; ++i) {
                        to_lshift[i].set('position', nextPosition);
                        ++nextPosition;
                    }
                }

                // need to sort
                collection.sort();
            }).fail(function () {
                $.alert.error(gt.gettext('Unable to reorder the panels of descriptor'));
            })
        }

        return false;
    },

    editLabel: function() {
        var model = this.model;

        $.ajax({
            type: "GET",
            url: this.model.url() + 'label/',
            dataType: 'json',
        }).done(function (data) {
            var labels = data;

            var ChangeLabel = Dialog.extend({
                template: require('../templates/descriptorpanelchangelabel.html'),
                templateHelpers/*templateContext*/: function () {
                    return {
                        labels: labels,
                    };
                },

                attributes: {
                    id: "dlg_change_labels",
                },

                ui: {
                    label: "#descriptor_panel_labels input",
                },

                events: {
                    'input @ui.label': 'onLabelInput',
                },

                initialize: function (options) {
                    ChangeLabel.__super__.initialize.apply(this);
                },

                onLabelInput: function (e) {
                    this.validateLabel(e);
                },

                validateLabel: function (e) {
                    var v = $(e.target).val();

                    if (v.length < 3) {
                        $(e.target).validateField('failed', gt.gettext('3 characters min'));
                        return false;
                    } else if (v.length > 64) {
                        $(e.target).validateField('failed', gt.gettext('64 characters max'));
                        return false;
                    }

                    $(e.target).validateField('ok');

                    return true;
                },

                validateLabels: function () {
                    $.each($(this.ui.label), function (i, label) {
                        var v = $(this).val();

                        if (v.length < 3) {
                            $(this).validateField('failed', gt.gettext('3 characters min'));
                            return false;
                        } else if (v.length > 64) {
                            $(this).validateField('failed', gt.gettext('64 characters max'));
                            return false;
                        }
                    });

                    return true;
                },

                onApply: function () {
                    var view = this;
                    var model = this.getOption('model');

                    var labels = {};

                    $.each($(this.ui.label), function (i, label) {
                        var v = $(this).val();
                        labels[$(label).attr("language")] = v;
                    });

                    if (this.validateLabels()) {
                        $.ajax({
                            type: "PUT",
                            url: model.url() + "label/",
                            dataType: 'json',
                            contentType: "application/json; charset=utf-8",
                            data: JSON.stringify(labels)
                        }).done(function () {
                            // manually update the current context label
                            model.set('label', labels[session.language]);
                            $.alert.success(gt.gettext("Successfully labeled !"));
                        }).always(function () {
                            view.destroy();
                        });
                    }
                },
            });

            var changeLabel = new ChangeLabel({model: model});
            changeLabel.render();
        });
        /*
        var ChangeLabel = Dialog.extend({
            template: require('../templates/descriptorpanelchangelabel.html'),

            attributes: {
                id: "dlg_change_label",
            },

            ui: {
                label: "#label",
            },

            events: {
                'input @ui.label': 'onLabelInput',
            },

            initialize: function (options) {
                ChangeLabel.__super__.initialize.apply(this);
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
                var model = this.getOption('model');

                if (this.validateLabel()) {
                    model.save({label: this.ui.label.val()}, {
                        patch: true,
                        wait: true,
                        success: function() {
                            view.destroy();
                            $.alert.success(gt.gettext("Successfully labeled !"));
                        },
                        error: function() {
                            $.alert.error(gt.gettext("Unable to change label !"));
                        }
                    });
                }
            },
        });

        var changeLabel = new ChangeLabel({model: this.model});

        changeLabel.render();
        changeLabel.ui.label.val(this.model.get('label'));*/
    },

    deleteDescriptorPanel: function() {
        var collection = this.model.collection;
        var position = this.model.get('position');

        this.model.destroy({
            wait: true,
            success: function () {
                for (var model in collection.models) {
                    var dmt = collection.models[model];
                    if (dmt.get('position') > position) {
                        var new_position = dmt.get('position') - 1;
                        dmt.set('position', new_position);
                    }
                }
            }
        });
    }
});

module.exports = View;
