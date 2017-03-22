# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate application configuration state.
"""


class Configuration:
    """
    Global configuration state list.
    """

    GOOD = 0
    IMPROPERLY_CONFIGURED = 1
    PARTIALLY_CONFIGURED = 2

    def __init__(self):
        self.configurations = {}

    def check(self, module, key, value, state):
        """
        Add a check status.

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
                'module': module,
                'values': [{
                    'state': state,
                    'value': value
                }]
            }

    def validate(self, module, key, value):
        self.check(module, key, value, Configuration.GOOD)

    def wrong(self, module, key, value):
        self.check(module, key, value, Configuration.IMPROPERLY_CONFIGURED)

    def partial(self, module, key, value):
        self.check(module, key, value, Configuration.PARTIALLY_CONFIGURED)

    def check_list(self):
        """
        Get the check list.
        """
        return list(self.configurations.values())

# Singleton of configuration
configuration = Configuration()
