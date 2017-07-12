# -*- coding: utf-8; -*-
#
# @file config.py
# @brief coll-gate application configuration state.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 


class Configuration(object):
    """
    Global configuration state list.
    """

    GOOD = 0
    IMPROPERLY_CONFIGURED = 1
    PARTIALLY_CONFIGURED = 2

    def __init__(self):
        self.configurations = {}

    def check(self, module_name, key, value, state):
        """
        Add a check status.

        :param module_name:
        :param key: Name of the check.
        :param value: Comment, text of the check.
        :param state: State of the validation of the check
        """
        config = self.configurations.get(key)

        if config is not None:
            config['values'].append({
                'state': state,
                'value': value
            })
        else:
            self.configurations[key] = {
                'name': key,
                'module': module_name,
                'values': [{
                    'state': state,
                    'value': value
                }]
            }

    def validate(self, module_name, key, value):
        self.check(module_name, key, value, Configuration.GOOD)

    def wrong(self, module_name, key, value):
        self.check(module_name, key, value, Configuration.IMPROPERLY_CONFIGURED)

    def partial(self, module_name, key, value):
        self.check(module_name, key, value, Configuration.PARTIALLY_CONFIGURED)

    def check_list(self):
        """
        Get the check list.
        """
        return list(self.configurations.values())

# Singleton of configuration
configuration = Configuration()
