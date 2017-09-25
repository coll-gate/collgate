/**
 * @file taxon.js
 * @brief Taxon router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');
var ClassificationModel = require('../models/classification');

var ClassificationListView = require('../views/classificationlist');
var ClassificationCreateView = require('../views/classificationadd');

var ClassificationRankListView = require('../views/classificationranklist');
var ClassificationRankCreateView = require('../views/classificationrankadd');

var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var ScrollingMoreView = require('../../main/views/scrollingmore');

var ClassificationCollection = require('../collections/classification');
var ClassificationRankCollection = require('../collections/classificationrank');


var ClassificationRouter = Marionette.AppRouter.extend({
    routes : {
        "app/classification/classification/": "getClassificationList",
        "app/classification/classification/:id/classificationrank/": "getClassificationIdRanksList"
    },

    getClassificationList : function() {
        var collection = new ClassificationCollection();

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of classifications")}));

        var classificationListView = new ClassificationListView({collection : collection});

        defaultLayout.showChildView('content', classificationListView);
        defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
            targetView: classificationListView,
            collection: collection
        }));

        classificationListView.query();

        if (session.user.isAuth && (session.user.isSuperUser || session.user.isStaff)) {
            defaultLayout.showChildView('bottom', new ClassificationCreateView({collection: collection}));
        }
    },

    getClassificationIdRanksList : function(id) {
        var classification = new ClassificationModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        var collection = new ClassificationRankCollection([], {classification_id: id});

        var classificationRankListView = new ClassificationRankListView({
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

            if (classification.get('can_modify') && session.user.isAuth && (session.user.isSuperUser || session.user.isStaff)) {
                defaultLayout.showChildView('bottom', new ClassificationRankCreateView({
                    model: classification, collection: collection}));
            }
        });
    }
});

module.exports = ClassificationRouter;
