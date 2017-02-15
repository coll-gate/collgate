/**
 * @file batchdescriptor.js
 * @brief Batch descriptor item view
 * @author Frederic SCHERMA
 * @date 2017-02-15
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescribableDetails = require('../../descriptor/views/describabledetails');
var BatchDescriptorEditView = require('../views/batchdescriptoredit');

var View = DescribableDetails.extend({
    onShowTab: function() {
        var view = this;

        var DefaultLayout = require('../../main/views/defaultlayout');
        var TitleView = require('../../main/views/titleview');

        var contextLayout = new DefaultLayout();
        application.getView().getRegion('right').show(contextLayout);

        var actions = ['modify'];

        var BatchDescriptorContextView = require('./batchdescriptorcontext');
        var contextView = new BatchDescriptorContextView({actions: actions});

        contextLayout.getRegion('title').show(new TitleView({title: gt.gettext("Descriptors")}));
        contextLayout.getRegion('content').show(contextView);

        contextView.on("describable:modify", function () {
            view.onModify();
        });
    },

    onHideTab: function() {
        application.main.defaultRightView();
    },

    onModify: function () {
        // does not reload models, just redo the views
        var name = this.model.get('name');

        // update the layout content
        var batchLayout = application.view().getRegion('content').currentView;

        var view = new BatchDescriptorEditView({model: this.model, descriptorMetaModelLayout: this.descriptorMetaModelLayout});
        batchLayout.getRegion('descriptors').show(view);

        // contextual panel
        var contextLayout = application.getView().getRegion('right').currentView;

        var actions = ['apply', 'cancel'];

        var BatchDescriptorContextView = require('../views/batchdescriptorcontext');
        var contextView = new BatchDescriptorContextView({actions: actions});
        contextLayout.getRegion('content').show(contextView);

        contextView.on("describable:cancel", function() {
            view.onCancel();
        });

        contextView.on("describable:apply", function() {
            view.onApply();
        });
    }
});

module.exports = View;