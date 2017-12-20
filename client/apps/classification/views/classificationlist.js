/**
 * @file classificationlist.js
 * @brief List of classification view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-04
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ClassificationView = require('../views/classification');
let AdvancedTable = require('../../main/views/advancedtable');

let View = AdvancedTable.extend({
    template: require("../templates/classificationlist.html"),
    className: "object classification-list advanced-table-container",
    childView: ClassificationView,
    childViewContainer: 'tbody.classification-list',

    defaultSortBy: ['name'],

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    },

    onBeforeAttach: function () {
        let self = this;
        let contextLayout = window.application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            window.application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Classification actions"), glyphicon: 'fa-wrench'}));

        let actions = [
            'add'
        ];

        let ClassificationListContextView = require('./classificationlistcontext');
        let contextView = new ClassificationListContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("classification:create", function () {
            self.onCreateClassification();
        });
    },

    onBeforeDetach: function () {
        window.application.main.defaultRightView();
    },

    onCreateClassification: function () {
        window.application.classification.controllers.classification.create(this.collection);
    }
});

module.exports = View;
