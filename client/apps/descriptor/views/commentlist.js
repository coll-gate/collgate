/**
 * @file commentlist.js
 * @brief Describable entity comments item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ItemView = require('../../main/views/itemview');

let View = ItemView.extend({
    tagName: 'div',
    template: require('../templates/commentlist.html'),

    templateContext: function () {
        let result = {};

        if (this.commentCollection) {
            let i;
            for (i = 0; i < this.commentCollection.length; i++) {
                let model = this.commentCollection.models[i];
                result[model.get('name')] = model.attributes;
            }
        }

        return {
            comments_data: result
        }
    },

    ui: {
        "comment": "tr.comment",
        "modify": "button.modify",
        "showCommentHistory": "span.show-comment-history"
    },

    triggers: {},

    events: {
        "click @ui.modify": "onModify",
        "click @ui.showCommentHistory": "onShowCommentHistory"
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this);

        this.layoutData = options.layoutData;
        this.commentCollection = options.commentCollection;
        this.listenTo(this.model, 'change:comment', this.render, this);
    },

    onRender: function () {
        let view = this;
        let model = this.model;
        // let descriptors = model.get('descriptors');
/*
        $.each(this.ui.comment, function (index) {
            let el = $(this);

            let pi = el.attr('panel-index');
            let i = el.attr('index');
            let id = el.attr('descriptor');
            let descriptorModel = view.descriptorCollection.get(id);
            let format = descriptorModel.get('format');

            let values = (model.get('descriptors')[descriptorModel.get('code')] ? model.get('descriptors')[descriptorModel.get('code')] : null);

            let widget = window.application.descriptor.widgets.newElement(format.type);
            if (widget) {
                widget.create(format, el.children('td.descriptor-value'), {
                    readOnly: true,
                    history: true,
                    descriptorId: descriptorModel.get('id')
                });

                widget.set(format, true, values, {
                    descriptorId: descriptorModel.get('id'),
                    descriptor: descriptorModel.attributes
                });
            }

            // save the descriptor format type widget instance
            descriptorModel.widget = widget;
        });*/
    },

    onDomRefresh: function () {

    },

    onBeforeDetach: function () {

    },

    onApply: function () {

    },

    onModify: function () {

    },

    onCancel: function () {

    },

    onShowHistory: function () {
        // @todo
        alert("@todo");
    },

    onShowCommentHistory: function (e) {
        // let tr = $(e.target).closest("tr");
        // let panelIndex = tr.attr("panel-index");
        // let index = tr.attr("index");
        //
        // let layoutDescriptorModel = this.layoutData.layout_content.panels[panelIndex].descriptors[index];
        // let descriptorModel = this.descriptorCollection.findWhere({name: layoutDescriptorModel.name});
        // if (descriptorModel && descriptorModel.widget) {
        //     let tokens = this.model.url().split('/');
        //
        //     let appLabel = tokens[tokens.length - 4];
        //     let modelName = tokens[tokens.length - 3];
        //     let objectId = tokens[tokens.length - 2];
        //     let valueName = '#' + descriptorModel.get('code');
        //
        //     let options = {};
        //
        //     descriptorModel.widget.showHistory(
        //         appLabel, modelName, objectId, valueName, descriptorModel, options);
        // }
    },

    onShowTab: function() {
        let view = this;

        // contextual panel
        let contextLayout = window.application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            window.application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Comments"), glyphicon: 'fa-wrench'}));

        let actions = ['add', 'apply', 'cancel', 'modify'];

        let CommentListContextView = require('./commentlistcontext');
        let contextView = new CommentListContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("comment:cancel", function() {
            view.onCancel();
        });

        contextView.on("comment:apply", function() {
            view.onApply();
        });
    },

    onHideTab: function() {
        window.application.main.defaultRightView();
    }
});

module.exports = View;
