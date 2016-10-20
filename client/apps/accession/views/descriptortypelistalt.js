/**
 * @file descriptortypelistalt.js
 * @brief Alternative list of types of descriptors for a group view
 * @author Frederic SCHERMA
 * @date 2016-10-14
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var ScrollView = require('../../main/views/scroll');

var DescriptorTypeModel = require('../models/descriptortype');
var DescriptorTypeAltView = require('../views/descriptortypealt');

var View = ScrollView.extend({
    template: require("../templates/descriptortypelistalt.html"),
    childView: DescriptorTypeAltView,
    childViewContainer: 'tbody.descriptor-type-list',

    ui: {
        'table': 'table.table',
    },

    events: {
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
    },

    dragEnter: function (e) {
        if (application.dndElement.$el.hasClass('descriptor-model-type')) {
            var count =  this.dragCount || 0;
            if (count == 0) {
                $(this.childViewContainer).css('border', '1px dashed #ddd');
            }
            ++count;
            this.dragCount = count;
        }
    },

    dragLeave: function (e) {
        if (application.dndElement.$el.hasClass('descriptor-model-type')) {
            var count =  this.dragCount || 1;
            --count;
            if (count == 0) {
                $(this.childViewContainer).css('border', 'none');
            }
             this.dragCount = count;
        }
    },

    dragOver: function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        //e.dataTransfer.dropEffect = 'move';
        return false;
    },

    dropContent: function (e) {
        if (!application.dndElement) {
            return;
        }

        if (application.dndElement.$el.hasClass('descriptor-model-type')) {
            // @todo call remove on application.dndElement.remove()
            $.alert.success(gt.gettext("Successfully removed"));

            $(this.childViewContainer).css('border', 'none');
            this.dragCount = 0;
        }
    }
});

module.exports = View;
