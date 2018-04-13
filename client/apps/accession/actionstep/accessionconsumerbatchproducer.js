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

let Format = function() {
    ActionStepFormat.call(this);

    this.name = "accessionconsumer_batchproducer";
    this.group = "standard";
    this.description = _t("Take a list of accession in input and generate one or many batch in output.");
};

_.extend(Format.prototype, ActionStepFormat.prototype, {
    defaultFormat: function() {
       return {
            'options': {},
            'producers': []
        };
    }
});

Format.ActionStepProcessView = ActionStepFormat.ActionStepProcessView.extend({
    className: 'action-step-process',
    template: require('../templates/actionstep/process/accessionconsumerbatchproducer.html'),

    ui: {
        accession_list: 'select[name=get-accession-list]',
        batch_group: 'div[name=batch-details]'
    },

    events: {
        'change @ui.accession_list': 'onGetAccessionList'
    },

    initialize: function(options) {
        options || (options = {readonly: true});

        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        this.ui.batch_group.css('display', 'none');
        this.ui.accession_list.selectpicker({});

        // get accession list from the previous step
        if (this.getOption("stepIndex") < 1) {
            this.ui.accession_list.prop('disabled', true);
        }
    },

    onBeforeDestroy: function() {
        this.ui.accession_list.selectpicker('destroy');
    },

    inputsType: function() {
        return 'none';
    },

    inputsData: function() {
        return null;
    },

    onGetAccessionList: function () {
        let type = this.ui.accession_list.val();

        if (this.getOption("stepIndex") < 1) {
            return;
        }

        if (type === 'original-csv') {
            this.downloadData('csv', this.getOption("stepIndex")-1);
        } else if (type === 'original-xlsx') {
            this.downloadData('xlsx', this.getOption("stepIndex")-1);
        } else if (type === 'original-panel') {
            // @todo a dialog to name the panel
            alert("todo");
        }

        this.ui.accession_list.val("").selectpicker('refresh');
    }
});

Format.ActionStepReadView = ActionStepFormat.ActionStepReadView.extend({
});

Format.ActionStepFormatDetailsView = ActionStepFormat.ActionStepFormatDetailsView.extend({
    className: 'action-step-format-details',
    template: require('../templates/actionstep/type/accessionconsumerbatchproducer.html'),

    regions: {
        'options': 'div[name=options]',
        'producer': 'div[name=producer]',
    },

    ui: {
        producerIndex: 'select[name=producer_index]',
        options: 'div[name=options]',
        producer: 'div[name=producer]',
        add_producer: 'button[name=add-producer]',
        delete_producer: 'button[name=delete-producer]'
    },

    events: {
        'click @ui.add_producer': 'onAddProducer',
        'click @ui.delete_producer': 'onDeleteCurrentProducer'
    },


    initialize: function(options) {
        Format.ActionStepFormatDetailsView.__super__.initialize.apply(this, arguments);
        this.listenTo(this.model, 'change', this.render, this);

        this.namingOptions = options.namingOptions || [];
        this.namingFormat = options.namingFormat || "";

        this.stepIndex = options.stepIndex || 0;
        this.currentProducerIndex= -1;
    },

    onRender: function() {
        let format = this.model.get('format')['steps'][this.stepIndex];

        for (let i = 0; i < format.producers.length; ++i) {
            this.ui.producerIndex.append('<option value="' + i + '">' + _t("Producer") + " " + i + '</option>');
        }

        this.ui.producerIndex.selectpicker({}).on('change', $.proxy(this.onChangeProducer, this));

        if (format.producers.length) {
            this.currentProducerIndex = 0;
            this.ui.producerIndex.val(0).selectpicker('refresh');
            this.loadCurrentProducer();
        }
    },

    onBeforeDetach: function () {
        this.ui.producerIndex.selectpicker('destroy');
    },

    defaultProducer: function() {
        return {
            'index': -1,
            'naming_options': {},
            'options': {}
        };
    },

    storeData: function() {
        this.storeCurrentProducer();
    },

    numProducers: function() {
        let format = this.model.get('format')['steps'][this.stepIndex];
        return format['producers'].length;
    },

    loadCurrentProducer: function() {
        if (this.currentProducerIndex >= 0) {
            let producer = this.model.get('format')['steps'][this.stepIndex]['producers'][this.currentProducerIndex];

            // naming option
            let NamingOptionsView = require('../views/namingoption');
            let namingOptionsView = new NamingOptionsView({
                namingFormat: this.namingFormat,
                namingOptions: this.namingOptions
            });

            this.showChildView('producer', namingOptionsView);
            namingOptionsView.setNamingOptions(producer.naming_options);
        }
    },

    storeCurrentProducer: function() {
        if (this.currentProducerIndex >= 0) {
            let producer = this.model.get('format')['steps'][this.stepIndex]['producers'][this.currentProducerIndex];
            producer.naming_options = this.getChildView('producer').getNamingOptions();
        }
    },

    onAddProducer: function() {
        let format = this.model.get('format')['steps'][this.stepIndex];
        let idx = parseInt(this.ui.producerIndex.val());
        let producers =  format.producers;
        let producer = undefined;

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

            idx = nextIdx;
        }

        this.storeCurrentProducer();
        this.currentProducerIndex = idx;
        this.loadCurrentProducer();
    },

    onChangeProducer: function() {
        let idx = parseInt(this.ui.producerIndex.val());

        this.storeCurrentProducer();
        this.currentProducerIndex = idx;
        this.loadCurrentProducer();
    },

    onRemoveProducer: function(idx) {
        let count = this.numProducers();

        if (idx >= 0 && idx < count) {
            // @todo
        }
    },

    onDeleteCurrentProducer: function () {
        if (this.currentProducerIndex >= 0) {
            let stepData = this.model.get('format').steps[this.stepIndex];
            stepData.producers.splice(this.currentProducerIndex, 1);

            this.getRegion('producer').empty();

            this.ui.producerIndex.find('option:not([value=-1])').remove();

            for (let i = 0; i < stepData.producers.length; ++i) {
               this.ui.producerIndex.append('<option value="' + i + '">' + _t("Producer") + " " + i + '</option>');
            }

            if (this.currentProducerIndex > 1) {
                --this.currentProducerIndex;
                this.loadCurrentProducer();
                this.ui.producerIndex.val(this.currentProducerIndex).selectpicker('refresh');
            } else if (this.currentProducerIndex === 0 && stepData.producers.length > 0) {
                this.loadCurrentProducer();
                this.ui.producerIndex.val(this.currentProducerIndex).selectpicker('refresh');
            } else {
                this.currentProducerIndex = -1;
            }

            this.ui.producerIndex.val(this.currentProducerIndex).selectpicker('refresh');
        }
    }
});

module.exports = Format;
