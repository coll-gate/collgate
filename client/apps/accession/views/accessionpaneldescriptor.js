/**
 * @file accessionpaneldescriptor.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var DescribableDetails = require('../../descriptor/views/describabledetails');
var AccessionPanelDescriptorEditView = require('./accessionpaneldescriptoredit');

var View = DescribableDetails.extend({

    onShowTab: function () {
        var view = this;

        var contextLayout = application.getView().getChildView('right');
        if (!contextLayout) {
            var DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            application.getView().showChildView('right', contextLayout);
        }

        var TitleView = require('../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Descriptors"), glyphicon: 'fa-wrench'}));

        var actions = ['modify'];

        var AccessionPanelDescriptorContextView = require('./accessionpaneldescriptorcontext');
        var contextView = new AccessionPanelDescriptorContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("describable:modify", function () {
            view.onModify();
        });

        contextView.on("descriptormetamodel:replace", function () {
            view.onReplace();
        });
    },

    onReplace: function () {
        // this will update the model and so on the view
        var AccessionPanelDescriptorCreateView = require('./accessionpaneldescriptorcreate');
        var accessionPanelDescriptorCreateView = new AccessionPanelDescriptorCreateView({model: this.model});

        accessionPanelDescriptorCreateView.onDefine();
    },

    onHideTab: function () {
        application.main.defaultRightView();
    },

    onModify: function () {
        // does not reload models, just redo the views

        // update the layout content
        var accessionPanelLayout = application.main.viewContent().getChildView('content');

        var view = new AccessionPanelDescriptorEditView({
            model: this.model,
            descriptorMetaModelLayout: this.descriptorMetaModelLayout
        });
        accessionPanelLayout.showChildView('descriptors', view);
    }
});

module.exports = View;
