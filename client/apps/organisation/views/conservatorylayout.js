/**
 * @file conservatorylayout.js
 * @brief Optimized layout for persoconservatory details
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-06-21
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let LayoutView = require('../../main/views/layout');
let ConservatoryDetailsView = require('../views/conservatorydetails');
let DescriptorEditView = require('../views/descriptoredit');
let EstablishmentModel = require('../models/establishment');
let DescriptorCollection = require('../../descriptor/collections/layoutdescriptor');

let Layout = LayoutView.extend({
    template: require("../templates/conservatorylayout.html"),

    ui: {
        descriptors_tab: 'a[aria-controls=descriptors]',
        storage_tab: 'a[aria-controls=storage]',
        comments_tab: 'a[aria-controls=comments]'
    },

    regions: {
        'descriptors': "div[name=descriptors]",
        'storage': "div[name=storage]",
        'comments': "div[name=comments]"
    },

    initialize: function(options) {
        Layout.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change:layout', this.onLayoutChange, this);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onPersonCreate, this);
        }
    },

    onPersonCreate: function(model, value) {
        // re-render once created
        this.render();

        // and update history
        Backbone.history.navigate('app/organisation/conservatory/' + this.model.get('id') + '/', {/*trigger: true,*/ replace: false});
    },

    onLayoutChange: function(model, value) {
        if (value == null) {
            this.getRegion('descriptors').empty();
        } else {
            let establishmentLayout = this;

            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: window.application.url(['descriptor', 'layout', value]),
                dataType: 'json'
            }).done(function (data) {

                let descriptorCollection = new DescriptorCollection([], {
                    model_id: data.id
                });

                descriptorCollection.fetch().then(function () {
                    let DescriptorView = require('../views/descriptor');
                    let descriptorView = new DescriptorView({
                        model: model,
                        layoutData: data,
                        descriptorCollection: descriptorCollection
                    });
                    establishmentLayout.showChildView('descriptors', descriptorView);

                });
            });
        }
    },

    // disableContactsTab: function () {
    //     this.ui.persons_tab.parent().addClass('disabled');
    // },

    onRender: function() {
        let conservatoryLayout = this;

        // details view
        if (!this.model.isNew()) {
            // establishment parent
            let establishment = new EstablishmentModel({id: this.model.get('establishment')});
            establishment.fetch().then(function () {
                conservatoryLayout.showChildView('details', new ConservatoryDetailsView({
                    model: conservatoryLayout.model,
                    establishment: establishment
                }));
            });

            // if necessary enable tabs
        } else {
            // establishment parent
            let establishment = new EstablishmentModel({id: this.model.get('establishment')});
            establishment.fetch().then(function () {
                conservatoryLayout.showChildView('details', new ConservatoryDetailsView({
                    model: conservatoryLayout.model,
                    establishment: establishment,
                    noLink: true
                }));
            });

            // descriptors edit tab
            $.ajax({
                method: "GET",
                url: window.application.url(['descriptor', 'layout', this.model.get('layout')]),
                dataType: 'json'
            }).done(function(data) {

                let descriptorCollection = new DescriptorCollection([], {
                    model_id: data.id
                });

                descriptorCollection.fetch().then(function () {
                    let descriptorView = new DescriptorEditView({
                        model: conservatoryLayout.model,
                        layoutData: data,
                        descriptorCollection: descriptorCollection
                    });
                    conservatoryLayout.showChildView('descriptors', descriptorView);
                });
            });

            // not available tabs
        }
    }
});

module.exports = Layout;
