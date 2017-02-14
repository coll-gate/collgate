/**
 * @file taxondescriptor.js
 * @brief Taxon descriptors view
 * @author Frederic SCHERMA
 * @date 2016-12-29
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescribableDetails = require('../../descriptor/views/describabledetails');
var TaxonDescriptorEditView = require('./taxondescriptoredit');

var View = DescribableDetails.extend({
    onShowTab: function() {
        var view = this;

        var DefaultLayout = require('../../main/views/defaultlayout');
        var TitleView = require('../../main/views/titleview');

        var contextLayout = new DefaultLayout();
        application.getView().getRegion('right').show(contextLayout);

        var actions = [];

        if (this.model.get('descriptor_meta_model') == null) {
            actions.push('add');
        } else {
            actions.push('modify');
            actions.push('replace');
            actions.push('delete');
        }

        var TaxonDescriptorsContextView = require('./taxondescriptorscontext');
        var contextView = new TaxonDescriptorsContextView({actions: actions});

        contextLayout.getRegion('title').show(new TitleView({title: gt.gettext("Descriptors")}));
        contextLayout.getRegion('content').show(contextView);

        contextView.on("describable:modify", function () {
            view.onModify();
        });

        contextView.on("descriptormetamodel:replace", function () {
            // this will update the model and so on the view
            var TaxonDescriptorCreateView = require('./taxondescriptorcreate');
            var taxonDescriptorCreateView = new TaxonDescriptorCreateView({model: view.model});

            taxonDescriptorCreateView.onDefine();
        });

        contextView.on("descriptormetamodel:delete", function () {
            var ConfirmDialog = require('../../main/views/confirmdialog');
            var confirmDialog = new ConfirmDialog({
                title: gt.gettext('Delete descriptors'),
                label: gt.gettext('Are you sure you want to delete any descriptors for this taxon ?')
            });
            confirmDialog.render();

            confirmDialog.on('dialog:confirm', function() {
                // this will update the model and so on the view
                view.model.save({descriptor_meta_model: null}, {patch: true, trigger: true});
            });
        });
    },

    onHideTab: function() {
        application.main.defaultRightView();
    },

    onModify: function() {
        // does not reload models, just redo the views
        var model = this.model;
        var name = model.get('name');

        // update the descriptor part of the taxon layout
        var taxonLayout = application.view().getRegion('content').currentView;

        var view = new TaxonDescriptorEditView({model: this.model, descriptorMetaModelLayout: this.descriptorMetaModelLayout});
        taxonLayout.getRegion('descriptors').show(view);

        // contextual panel
        var contextLayout = application.getView().getRegion('right').currentView;

        var actions = ['apply', 'cancel'];

        var TaxonDescriptorsContextView = require('../views/taxondescriptorscontext');
        var contextView = new TaxonDescriptorsContextView({actions: actions});
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
