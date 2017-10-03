/**
 * @file accessionpaneldescriptoredit.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-09-14
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var DescribableEdit = require('../../descriptor/views/describableedit');

var View = DescribableEdit.extend({
    onCancel: function() {
        // cancel global widget modifications
        this.cancel();

        // non existing classification entry, simply reload previous content (url has not changed)
        if (this.model.isNew()) {
            Backbone.history.loadUrl();
            return;
        }

        // does not reload models, just redo the views
        var view = this;

        // update the descriptor part of the classification entry layout
        var accessionPanelLayout = application.main.viewContent().getChildView('content');

        var AccessionPanelDescriptorView = require('./accessionpaneldescriptor');
        var accessionPanelDescriptorView = new AccessionPanelDescriptorView({
            model: this.model,
            descriptorMetaModelLayout: view.descriptorMetaModelLayout});

        accessionPanelLayout.showChildView('descriptors', accessionPanelDescriptorView);
    },

    onApply: function () {
        // does not reload models, save and redo the views
        var view = this;
        var model = this.model;

        var descriptors = this.prepareDescriptors();
        if (descriptors === null) {
            return;
        }

        this.model.save({descriptors: descriptors}, {wait: true, patch: !model.isNew()}).then(function () {
            // update the descriptor part of the classification entry layout
            var accessionPanelLayout = application.main.viewContent().getChildView('content');

            var AccessionPanelDescriptorView = require('./accessionpaneldescriptor');
            var accessionPanelDescriptorView = new AccessionPanelDescriptorView({
                model: model,
                descriptorMetaModelLayout: view.descriptorMetaModelLayout});

            accessionPanelLayout.showChildView('descriptors', accessionPanelDescriptorView);
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

        var ClassificationEntryDescriptorContextView = require('./accessiondescriptorcontext');
        var contextView = new ClassificationEntryDescriptorContextView({actions: actions});
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
