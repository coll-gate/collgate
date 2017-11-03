/**
 * @file descriptoredit.js
 * @brief Organisation and establishment descriptor item edit view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-07
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescribableEdit = require('../../descriptor/views/describableedit');

let View = DescribableEdit.extend({
    onCancel: function() {
        // cancel global widget modifications
        this.cancel();

        // non existing entity, simply reload previous content (url has not changed)
        if (this.model.isNew()) {
            Backbone.history.loadUrl();
            return;
        }

        // does not reload models, just redo the views
        let view = this;
        let name = this.model.get('name');

        // update the layout content
        let layout = application.main.viewContent().getChildView('content');

        let DescriptorView = require('../views/descriptor');
        let descriptorView = new DescriptorView({
            model: this.model,
            descriptorMetaModelLayout: view.descriptorMetaModelLayout});

        layout.showChildView('descriptors', descriptorView);
    },

    onApply: function () {
        // does not reload models, save and redo the views
        let view = this;
        let model = this.model;

        let descriptors = this.prepareDescriptors();
        if (descriptors === null) {
            return;
        }

        let isNew = this.model.isNew();

        this.model.save({descriptors: descriptors}, {wait: true, patch: !isNew}).then(function () {
            let layout = application.main.viewContent().getChildView('content');

            // update the layout content
            let DescriptorView = require('../views/descriptor');
            let descriptorView = new DescriptorView({
                model: model,
                descriptorMetaModelLayout: view.descriptorMetaModelLayout});

            layout.showChildView('descriptors', descriptorView);
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

        let DescriptorContextView = require('../views/descriptorcontext');
        let contextView = new DescriptorContextView({actions: actions});
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
