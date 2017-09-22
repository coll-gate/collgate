/**
 * @file classificationrank.js
 * @brief Classification rank item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object classification-rank actions',
    template: require('../templates/classificationrank.html'),
    attributes: function () {
        return {
            'scope': 'row',
            'element-id': this.model.get('id')
        }
    },
    templateContext: function () {
        return {
            classification: this.getOption('classification')
        }
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: false},
                tag: {display: true, title: _t("Edit label"), event: 'renameClassificationRank'},
                manage: {display: true, event: 'viewClassificationEntry'},
                remove: {display: true, event: 'deleteClassificationRank'}
            }
        }
    },

    ui: {
        status_icon: 'td.lock-status',
        delete_btn: 'td.action.remove',
        edit_label_btn: 'td.action.edit-label',
        manage_btn: 'td.action.manage',
        rename_btn: 'td.action.rename'
    },

    events: {
        'dragstart': 'dragStart',
        'dragend': 'dragEnd',
        'dragover': 'dragOver',
        'dragenter': 'dragEnter',
        'dragleave': 'dragLeave',
        'drop': 'drop',
        // 'click @ui.delete_btn': 'deleteClassification',
        'click @ui.edit_label_btn': 'editLabel',
        'click @ui.manage_btn': 'viewClassificationEntry',
        'click @ui.rename_btn': 'renameClassificationRank'
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change', this.render, this);
    },

    actionsProperties: function() {
        var properties = {
            tag: {disabled: false},
            remove: {disabled: false}
        };

        // @todo do we want can_modify/can_delete like for descriptor ?
        if (!this.getOption('classification').get('can_modify') || !session.user.isSuperUser || !session.user.isStaff) {
            properties.tag.disabled = true;
        } else {
            this.$el.prop('draggable', true);
        }

        if (!this.getOption('classification').get('can_delete') || !session.user.isSuperUser || !session.user.isStaff) {
            properties.remove.disabled = true;
        }

        return properties;
    },

    viewClassificationEntry: function () {
        Backbone.history.navigate("app/classification/classification/" + this.model.id + "/classificationrank/entry/", {trigger: true});
        return false;
    },

    deleteClassificationRank: function () {
        this.model.destroy({wait: true});
        /*if (this.model.get('num_classification_entries') === 0) {
            this.model.destroy({wait: true});
        } else {
            $.alert.error(_t("Some entries exists for this classification rank"));
        }*/
        return false;
    },

    editLabel: function() {
        if (!this.getOption('classification').get('can_modify') || !session.user.isSuperUser || !session.user.isStaff) {
            return false;
        }

        var ChangeLabel = require('../../main/views/entitychangelabel');
        var changeLabel = new ChangeLabel({
            model: this.model,
            title: _t("Change the labels for the classification rank")});

        changeLabel.render();

        return false;
    },

    renameClassificationRank: function() {
        var ChangeName = require('../../main/views/entityrename');
        var changeName = new ChangeName({
            model: this.model,
            title: _t("Rename classification rank")
        });

        changeName.render();
        changeName.ui.name.val(this.model.get('name'));

        return false;
    },

    dragStart: function(e) {
        // fix for firefox...
        e.originalEvent.dataTransfer.setData('text/plain', null);

        this.$el.css('opacity', '0.4');
        application.main.dnd.set(this, 'classification-rank');
    },

    dragEnd: function(e) {
        this.$el.css('opacity', '1.0');
        application.main.dnd.unset();
    },

    dragOver: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        //e.originalEvent.dataTransfer.dropEffect = 'move';
        return false;
    },

    dragEnter: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        if (!application.main.dnd.hasView('classification-rank')) {
            return false;
        }

        if (application.main.dnd.get().$el.hasClass('classification-rank')) {
            application.main.dnd.setTarget(this);

            if (this.model.get('level') < application.main.dnd.get().model.get('level')) {
                this.$el.css('border-top', '5px dashed #ddd');
            } else if (this.model.get('level') > application.main.dnd.get().model.get('level')) {
                this.$el.css('border-bottom', '5px dashed #ddd');
            }
        }

        return false;
    },

    dragLeave: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        if (!application.main.dnd.hasView('classification-rank')) {
            return false;
        }

        if (application.main.dnd.get().$el.hasClass('classification-rank')) {
            if (this.model.get('level') < application.main.dnd.get().model.get('level')) {
                this.$el.css('border-top', 'initial');
            } else if (this.model.get('level') > application.main.dnd.get().model.get('level')) {
                this.$el.css('border-bottom', 'initial');
            }
        }

        return false;
    },

    drop: function (e) {
        if (e.originalEvent.stopPropagation) {
            e.originalEvent.stopPropagation();
        }

        if (!application.main.dnd.hasView('classification-rank')) {
            return false;
        }

        var elt = application.main.dnd.get();
        if (elt.$el.hasClass('classification-rank')) {
            // reset borders
            this.$el.css('border-top', 'initial');
            this.$el.css('border-bottom', 'initial');

            if (this.model.collection) {
                // var dst = $(e.originalEvent.target).parent('tr');
                // var dstId = parseInt(dst.attr('element-id'));

                this.model.collection.moveClassificationRankAfter(
                    elt.model.get('id'),
                    application.main.dnd.getTarget().model.get('id'));
            }
        }

        return false;
    }
});

module.exports = View;
