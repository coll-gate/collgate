/**
 * @file classificationranklist.js
 * @brief List of rank of classification view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ClassificationRankView = require('../views/classificationrank');
let AdvancedTable = require('../../main/views/advancedtable');

let View = AdvancedTable.extend({
    template: require("../templates/classificationranklist.html"),
    className: "object classification-rank-list advanced-table-container",
    childView: ClassificationRankView,
    childViewContainer: 'tbody.classification-rank-list',

    defaultSortBy: ['level'],

    childViewOptions: function () {
        return {
            classification: this.getOption('classification')
        }
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

    initialize: function(options) {
        View.__super__.initialize.apply(this, arguments);

        this.listenTo(this.collection, 'reset', this.render, this);
        // this.listenTo(this.collection, 'remove', this.render, this);
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

        if (!application.main.dnd.hasView('classification-rank')) {
            return false;
        }

        if (this.dragEnterCount === 1) {
            application.main.dnd.unsetTarget();

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

        if (!application.main.dnd.hasView('classification-rank')) {
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

        if (!application.main.dnd.hasView('classification-rank')) {
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

        if (!application.main.dnd.hasView('classification-rank')) {
            return false;
        }

        this.$el.find("tbody tr").last().css('border-bottom', 'initial');
        this.$el.find("thead tr th").css('border-bottom', 'initial');

        let elt = application.main.dnd.get();
        if (elt.$el.hasClass('classification-rank')) {
            // let dst = $(e.originalEvent.target).parent('tr');
            // let dstId = parseInt(dst.attr('element-id'));

            if (application.main.dnd.getTarget()) {
                this.collection.moveClassificationRankAfter(
                    elt.model.get('id'),
                    application.main.dnd.getTarget().model.get('id'));
            } else {
                this.collection.moveClassificationRankAfter(elt.model.get('id'), null);
            }
        }

        return false;
    }
});

module.exports = View;
