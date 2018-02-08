/**
 * @file accessionconsumerbatchproducer.js
 * @brief Accession consumer - Batch producer step
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-02-06
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ActionStepFormat = require('./actionstepformat');
let Marionette = require('backbone.marionette');

let Format = function() {
    ActionStepFormat.call(this);

    this.name = "accessionconsumer_batchproducer";
    this.group = "standard";
};

_.extend(Format.prototype, ActionStepFormat.prototype, {

});

Format.ActionStepFormatDetailsView = Marionette.View.extend({
    className: 'action-step-format-details',
    template: require('../templates/actionstep/accessionconsumerbatchproducer.html'),

    regions: {
        'options': 'div[name=options]',
        'producer': 'div[name=producer]',
    },

    ui: {
        producerIndex: 'select[name=producer_index]',
        options: 'div[name=options]',
        producer: 'div[name=producer]',
    },

    initialize: function(options) {
        Format.ActionStepFormatDetailsView.__super__.initialize.apply(this, arguments);
        this.listenTo(this.model, 'change', this.render, this);

        this.namingOptions = options.namingOptions || [];
        this.namingFormat = options.namingFormat || "";
        this.stepIndex = options.stepIndex || 0;

        if (!this.model.get('format')['steps'][this.stepIndex]) {
            this.model.get('format')['steps'][this.stepIndex] = this.defaultFormat();
        }
    },

    onRender: function() {
        let format = this.model.get('format')['steps'][this.stepIndex];

        for (let i = 0; i < format.producers.length; ++i) {
            this.ui.producerIndex.append('<option value="' + i + '">' + _t("Producer") + " " + i + '</option>');
        }

        this.ui.producerIndex.selectpicker({}).on('change', $.proxy(this.onChangeProducer, this));

        for (let i = 0; i < format.producers.length; ++i) {
            this.setupProducer(i, format.producers[i]);
        }
    },

    onBeforeDetach: function () {
        this.ui.producerIndex.selectpicker('destroy');
    },

    defaultFormat: function() {
        return {
            'options': {},
            'producers': []
        };
    },

    defaultProducer: function() {
        return {
            'index': -1,
            'naming_options': {},
            'options': {}
        };
    },

    getFormat: function() {
        let options = {};
        let producers = [];   // @todo

        return {
            'options': options,
            'producers': producers
        }
    },

    setupProducer: function(index, producer) {
        // options
        // nothing for the moment

        // naming option
        let NamingOptionsView = require('../views/namingoption');
        let namingOptionsView = new NamingOptionsView({
            namingFormat: this.namingFormat,
            namingOptions: this.namingOptions
        });

        this.showChildView('producer', namingOptionsView);
        namingOptionsView.setNamingOptions(producer.naming_options);
    },

    numProducers: function() {
        let format = this.model.get('format')['steps'][this.stepIndex];
        return format['producers'].length;
    },

    onChangeProducer: function() {
        let format = this.model.get('format')['steps'][this.stepIndex];
        let idx = parseInt(this.ui.producerIndex.val());
        let producers =  format.producers;
        let producer = undefined;

        if (idx < 0) {
            // create a new one
            if (producers.length >= 5) {
                $.alert.warning(_t("Cannot create more than 5 producers"));
            } else {
                let nextIdx = producers.length;

                producer = this.defaultProducer();
                producer.index = nextIdx;

                // initial producer data
                producers.push(producer);

                this.ui.producerIndex
                    .append('<option value="' + nextIdx + '">' + _t("Producer") + " " + nextIdx + '</option>')
                    .val(nextIdx)
                    .selectpicker('refresh');

                this.setupProducer(nextIdx, producer);
            }
        } else {

        }
    },

    onRemoveProducer: function(idx) {
        let count = this.numProducers();

        if (idx >= 0 && idx < count) {
            // @todo
        }
    }
});

module.exports = Format;
