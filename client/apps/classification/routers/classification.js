/**
 * @file taxon.js
 * @brief Taxon router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');
let ClassificationModel = require('../models/classification');

let ClassificationListView = require('../views/classificationlist');

let ClassificationRankListView = require('../views/classificationranklist');
let ClassificationRankCreateView = require('../views/classificationrankadd');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let ScrollingMoreView = require('../../main/views/scrollingmore');

let ClassificationCollection = require('../collections/classification');
let ClassificationRankCollection = require('../collections/classificationrank');


let ClassificationRouter = Marionette.AppRouter.extend({
    routes : {
        "app/classification/classification/": "getClassificationList",
        "app/classification/classification/:id/classificationrank/": "getClassificationIdRanksList"
    },

    getClassificationList : function() {
        let collection = new ClassificationCollection();

        let defaultLayout = new DefaultLayout({});
        window.application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of classifications")}));

        let classificationListView = new ClassificationListView({collection : collection});

        defaultLayout.showChildView('content', classificationListView);
        defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
            targetView: classificationListView,
            collection: collection
        }));

        classificationListView.query();
    },

    getClassificationIdRanksList : function(id) {
        let classification = new ClassificationModel({id: id});

        let defaultLayout = new DefaultLayout();
        window.application.main.showContent(defaultLayout);

        let collection = new ClassificationRankCollection([], {classification_id: id});

        let classificationRankListView = new ClassificationRankListView({
                classification: classification,
                collection: collection
            });

        defaultLayout.showChildView('content', classificationRankListView);
        defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
            targetView: classificationRankListView,
            collection: collection
        }));

        classification.fetch().then(function () {
            defaultLayout.showChildView('title', new TitleView({
                title: _t("Classification rank"),
                model: classification
            }));

            // need classification permission details
            classificationRankListView.query();

            if (classification.get('can_modify') && window.session.user.isAuth &&
                (window.session.user.isSuperUser || window.session.user.isStaff)) {

                defaultLayout.showChildView('bottom', new ClassificationRankCreateView({
                    model: classification, collection: collection}));
            }
        });
    }
});

module.exports = ClassificationRouter;
