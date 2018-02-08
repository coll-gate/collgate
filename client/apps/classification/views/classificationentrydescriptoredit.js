/**
 * @file classificationentrydescriptoredit.js
 * @brief Classification entry descriptor edit view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-29
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescribableEdit = require('../../descriptor/views/describableedit');

let View = DescribableEdit.extend({
    onCancel: function() {
        // cancel global widget modifications
        this.cancel();

        // non existing classification entry, simply reload previous content (url has not changed)
        if (this.model.isNew()) {
            Backbone.history.loadUrl();
            return;
        }

        // does not reload models, just redo the views
        let view = this;

        // update the descriptor part of the classification entry layout
        let classificationEntryLayout = application.main.viewContent().getChildView('content');

        let ClassificationEntryDescriptorView = require('./classificationentrydescriptor');
        let classificationEntryDescriptorView = new ClassificationEntryDescriptorView({
            model: this.model,
            layoutData: view.layoutData,
            descriptorCollection: this.descriptorCollection
        });

        classificationEntryLayout.showChildView('descriptors', classificationEntryDescriptorView);
    },

    onApply: function () {
        // does not reload models, save and redo the views
        let self = this;
        let model = this.model;

        let descriptors = this.prepareDescriptors();
        if (descriptors === null) {
            return;
        }

        this.model.save({descriptors: descriptors}, {wait: true, patch: !model.isNew()}).then(function () {
            // update the descriptor part of the classification entry layout
            let classificationEntryLayout = application.main.viewContent().getChildView('content');

            let ClassificationEntryDescriptorView = require('./classificationentrydescriptor');
            let classificationEntryDescriptorView = new ClassificationEntryDescriptorView({
                model: model,
                layoutData: self.layoutData,
                descriptorCollection: self.descriptorCollection
            });

            classificationEntryLayout.showChildView('descriptors', classificationEntryDescriptorView);
        });
    },

    onShowTab: function() {
        let view = this;

        // contextual panel
        let contextLayout = application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Descriptors"), glyphicon: 'fa-wrench'}));

        let actions = ['apply', 'cancel'];

        let ClassificationEntryDescriptorContextView = require('./classificationentrydescriptorcontext');
        let contextView = new ClassificationEntryDescriptorContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("describable:cancel", function() {
            view.onCancel();
        });

        contextView.on("describable:apply", function() {
            view.onApply();
        });
    },

    onHideTab: function() {
        application.main.defaultRightView();
    }
});

module.exports = View;
