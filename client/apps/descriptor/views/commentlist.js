/**
 * @file commentlist.js
 * @brief Describable entity comments item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let AdvancedTable = require('../../main/views/advancedtable');
let CommentView = require('./comment');
let DescriptorsColumnsView = require('../mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    className: "comment-list advanced-table-container",
    childView: CommentView,

    userSettingName: 'comment_list_columns',
    userSettingVersion: '1.0',

    templateContext: function () {
        return {
            columnsList: this.displayedColumns,
            columnsOptions: this.getOption('columns')
        }
    },

    childViewOptions: function () {
        return {
            columnsList: this.displayedColumns,
            columnsOptions: this.getOption('columns')
        }
    },

    defaultColumns: [
        {name: 'label', width: 'auto', sort_by: '+0'},
        {name: 'value', width: 'auto', sort_by: null}
    ],

    columnsOptions: {
        'label': {label: _t('Label'), minWidth: true, event: 'modify-comment'},
        'value': {label: _t('Value'), minWidth: true, event: 'modify-comment'}
    },

    ui: {
        "add": "button.add",
        // "showCommentHistory": "span.show-comment-history"
    },

    triggers: {},

    events: {
        "click @ui.add": "onAdd",
        // "click @ui.showCommentHistory": "onShowCommentHistory"
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this, arguments);

        if (options.model) {
            this.model = options.model;
        }

        this.listenTo(this.model, 'change:comment', this.render, this);
    },

    onRender: function () {
        View.__super__.onRender.apply(this, arguments);
    },

    onAdd: function () {
        let CreateComment = require('./commentcreate');
        let createComment = new CreateComment({model: this.model});

        createComment.render();
        return false;
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

        let actions = ['add'];

        let CommentListContextView = require('./commentlistcontext');
        let contextView = new CommentListContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("comment:add", function() {
            view.onAdd();
        });
    },

    onHideTab: function() {
        window.application.main.defaultRightView();
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
