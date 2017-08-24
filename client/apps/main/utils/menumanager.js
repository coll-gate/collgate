/**
 * @file menumanager.js
 * @brief Dynamic menu manager.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-08-24
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Menu = require('./menu');
var MenuEntry = require('./menuentry');
var MenuSeparator = require('./menuseparator');

var MenuManager = function() {
    this.menus = {};
};

MenuManager.prototype = {
    merge: function(org, menu) {

    },

    add: function(menu) {

    },

    /*
        def merge_menu(self, org, menu):
        for entry in menu.entries:
            org.add_entry(entry)

    def add_menu(self, menu):
        """
        Add a new menu to this module. If the menu already exists
        it is merged with the previous one.
        :param menu: A valid module menu.
        """
        if not menu:
            return
        if not isinstance(menu, ModuleMenu):
            raise ModuleException('menu Must be a ModuleMenu')

        for m in self.menus:
            if m.name == menu.name:
                # merge menu on existing
                self.merge_menu(m, menu)
                return

        i = 0
        for m in self.menus:
            if m.order <= menu.order:
                i += 1
            else:
                break
        self.menus.insert(i, menu)*/
};

module.exports = MenuManager;
