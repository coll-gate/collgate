/**
 * @file dnd.js
 * @brief Drag and drop global management.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-07-07
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var DragAndDrop = function() {
    this.dndType = 'undefined';
    this.classification = [];
    this.dnd = null;

    this.SELECTOR = 'selector';
    this.VIEW = 'view';
    this.ARRAY = 'array';
    this.OBJECT = 'object';
    this.INTEGER = 'integer';
    this.NUMBER = 'number';
    this.STRING = 'string';
    this.UNDEFINED = 'undefined';
};

DragAndDrop.prototype = {
    /**
     * Set current DND object.
     */
    set: function(dnd, classification) {
        classification || (classification = '');

        if (dnd) {
            this.dnd = dnd;
            this.classification = classification.split(' ');

            if (dnd instanceof jQuery) {
                this.dndType = this.SELECTOR;
            } else if (dnd instanceof Backbone.View) {
                this.dndType = this.VIEW;
            } else if (dnd instanceof Array) {
                this.dndType = this.ARRAY;
            } else if (dnd instanceof Object) {
                this.dndType = this.OBJECT;
            } else {
                if (typeof dnd === Number) {
                    if (Number.isInteger(dnd)) {
                        this.dndType = this.INTEGER;
                    } else {
                        this.dndType = this.NUMBER;
                    }
                } else if (typeof dnd === 'string') {
                    this.dndType = this.STRING;
                } else {
                    this.dndType = this.UNDEFINED;
                }
            }
        } else {
            this.unset();
        }
    },

    get: function() {
        return this.dnd;
    },

    /**
     * Unset previously DND object.
     */
    unset: function() {
        if (this.dnd) {
            this.dnd = null;
            this.dndType = this.UNDEFINED;
            this.classification = [];
        }
    },

    /**
     * Is current DND element defined.
     * @param type Type of dnd object.
     * @param classification If not null compare with the list of classification previously set.
     * If classification is null the comparison is based only of the type.
     */
    is: function(type, classification) {
        type || (type = 'selector');

        if (this.dnd) {
            if (this.dndType === type) {
                if (classification) {
                    var classes = classification.split(' ');
                    return _.difference(classes, this.classification).length === 0;
                } else {
                    return true;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    },

    /**
     * Is the current unique instance of DND object is valid and is a jQuery element.
     */
    isSelector: function(classification) {
        return this.is(this.SELECTOR, classification);
    },

    /**
     * Is the current unique instance of DND object is valid and is a backbone view.
     */
    isView: function(classification) {
        return this.is(this.VIEW, classification);
    },

    /**
     * The list of classification is ORed and not ANDed compared to has method.
     * @param type Type of dnd object.
     * @param classifications If not null compare with the list of classification previously set.
     */
    has: function(type, classifications) {
        type || (type = 'selector');

        if (this.dnd) {
            if (this.dndType === type) {
                if (classifications) {
                    var classes = classifications.split(' ');
                    return _.intersection(classes, this.classification).length > 0;
                } else {
                    return true;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    },

    /**
     * Helper for accept of type of jQuery selector.
     */
    hasSelector: function(classifications) {
        return this.has(this.SELECTOR, classifications);
    },

    /**
     * Helper for accept of type of backbone view.
     */
    hasView: function(classifications) {
        return this.has(this.VIEW, classifications);
    }
};

module.exports = DragAndDrop;
