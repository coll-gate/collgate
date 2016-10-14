/**
 * @file descriptormodeltypelist.js
 * @brief List of type of model of descriptors for a model model of descriptor view
 * @author Frederic SCHERMA
 * @date 2016-09-28
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var ScrollView = require('../../main/views/scroll');

var DescriptorModelTypeModel = require('../models/descriptormodeltype');
var DescriptorModelTypeView = require('../views/descriptormodeltype');

var View = ScrollView.extend({
    template: require("../templates/descriptormodeltypelist.html"),
    childView: DescriptorModelTypeView,
    childViewContainer: 'tbody.descriptor-model-type-list',

    ui: {
        'table_body': 'tbody.descriptor-model-type-list',
    },

    events: {
        'dragenter @ui.table_body': 'dragEnter',
        'dragleave @ui.table_body': 'dragLeave',
        'dragenter': 'dragEnter',
        'dragleave': 'dragLeave',
        'dragover': 'dragOver',
        'drop': 'dropContent',
    },

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);

        View.__super__.initialize.apply(this);

        //$("div.left-content").on("dragenter", this.dragEnterContent);
       // $("div.left-content").on("dragleave", this.dragLeaveContent);
        //$("div.left-content").on("dragover", this.dragOver);
        //$("div.left-content").on("drop", this.dropContent);
    },

    dragOver: function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        //e.dataTransfer.dropEffect = 'move';
        return false;
    },

    dragEnter: function (e) {
        $(e.target).addClass('draggable-over');
    },

    dragLeave: function (e) {
        $(e.target).removeClass('draggable-over');
    },

    dragEnterContent: function (e) {
        $("div.left-content").css('background', '#ddd');
        $("div.left-content").css('border', '2 px dashed');
    },

    dragLeaveContent: function (e) {
        $("div.left-content").css('background', 'initial');
        $("div.left-content").css('border', 'none');
    },

    dropContent: function (e) {
        if (application.dndElement.$el.hasClass('descriptor-type')) {
            alert("descriptor-type ", application.dndElement.model.get('code'));
            this.collection.create({
                descriptor_type_code: application.dndElement.model.get('code'),
                label: 'test1',
            });
        } else if (application.dndElement.$el.hasClass('descriptor-model-type')) {
            alert("descriptor-model-type");
        }

        $("div.left-content").css('background', 'initial');
        $("div.left-content").css('border', 'none');
    }
});

module.exports = View;