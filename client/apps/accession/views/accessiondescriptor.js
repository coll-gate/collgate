/**
 * @file accessiondescriptor.js
 * @brief Accession descriptor item view
 * @author Frederic SCHERMA
 * @date 2016-12-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescribableDetails = require('../../descriptor/views/describabledetails');
var AccessionDescriptorEditView = require('../views/accessiondescriptoredit');

var View = DescribableDetails.extend({
    onShowTab: function() {
        var view = this;

        var DefaultLayout = require('../../main/views/defaultlayout');
        var TitleView = require('../../main/views/titleview');

        var contextLayout = new DefaultLayout();
        application.getView().getRegion('right').show(contextLayout);

        var actions = ['modify'];

        var AccessionDescriptorsContextView = require('./accessiondescriptorscontext');
        var contextView = new AccessionDescriptorsContextView({actions: actions});

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
        var accessionLayout = application.view().getRegion('content').currentView;

        var view = new AccessionDescriptorEditView({model: this.model, descriptorMetaModelLayout: this.descriptorMetaModelLayout});
        accessionLayout.getRegion('descriptors').show(view);

        // contextual panel
        var contextLayout = application.getView().getRegion('right').currentView;

        var actions = ['apply', 'cancel'];

        var AccessionDescriptorsContextView = require('../views/accessiondescriptorscontext');
        var contextView = new AccessionDescriptorsContextView({actions: actions});
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