/**
 * @file descriptoredit.js
 * @brief Organisation and establishment descriptor item edit view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-07
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var DescribableEdit = require('../../descriptor/views/describableedit');

var View = DescribableEdit.extend({
    onCancel: function() {
        // cancel global widget modifications
        this.cancel();

        // non existing entity, simply reload previous content (url has not changed)
        if (this.model.isNew()) {
            Backbone.history.loadUrl();
            return;
        }

        // does not reload models, just redo the views
        var view = this;
        var name = this.model.get('name');

        // update the layout content
        var layout = application.main.viewContent().getChildView('content');

        var DescriptorView = require('../views/descriptor');
        var descriptorView = new DescriptorView({
            model: this.model,
            descriptorMetaModelLayout: view.descriptorMetaModelLayout});

        layout.showChildView('descriptors', descriptorView);
    },

    onApply: function () {
        // does not reload models, save and redo the views
        var view = this;
        var model = this.model;

        var descriptors = this.prepareDescriptors();
        if (descriptors === null) {
            return;
        }

        var isNew = this.model.isNew();

        this.model.save({descriptors: descriptors}, {wait: true, patch: !isNew}).then(function () {
            var layout = application.main.viewContent().getChildView('content');

            // update the layout content
            var DescriptorView = require('../views/descriptor');
            var descriptorView = new DescriptorView({
                model: model,
                descriptorMetaModelLayout: view.descriptorMetaModelLayout});

            layout.showChildView('descriptors', descriptorView);
        });
    },

    onShowTab: function() {
        var view = this;

        // contextual panel
        var contextLayout = application.getView().getChildView('right');
        if (!contextLayout) {
            var DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            application.getView().showChildView('right', contextLayout);
        }

        var TitleView = require('../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Descriptors"), glyphicon: 'fa-wrench'}));

        var actions = ['apply', 'cancel'];

        var DescriptorContextView = require('../views/descriptorcontext');
        var contextView = new DescriptorContextView({actions: actions});
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
