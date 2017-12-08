# -*- coding: utf-8; -*-
#
# @file basefactory.py
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-11-30
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 


class BaseFactory(object):

    def __init__(self):
        self.name = None     # name of the factory for registration, must be unique
        self.model = None    # related Django model

        self.cache = {}
        self.cache_name_to_id = {}

    def create_or_update(self, manager, data, bulk=True):
        """
        Create or update one or many entities from a list of data or a single data entry.
        :param manager: Factory manager instance.
        :param data: A single instance of a dict of name:data.
        :param bulk: In case of a list of instance for data, process data by bulk.
        """
        pass

    def delete(self, manager, which):
        """
        Delete if exists one or many entities from a list of data or a single data entry.
        :param manager: Factory manager instance.
        :param which: A single id or a list of ids.
        """
        pass

    def get(self, manager, which):
        """
        Get if exists one or many entities from a list of data or a single data entry.
        :param manager: Factory manager instance.
        :param which: A single id or a list of ids.
        """
        pass

    def set_entry(self, entry_id, entry_code_or_name, entry):
        """
        Set in a dedicated cache the entry.
        :param entry_id: Unique identifier of the entry.
        :param entry_code_or_name: Unique code or name (str) of the entry.
        :param entry: Entry data
        """
        self.cache[entry_id] = entry
        self.cache_name_to_id[entry_code_or_name] = entry_id

    def get_entry(self, identifier):
        """
        Get an entry from the dedicated cache of the factory.
        :param identifier: Entry unique identifier (integer) or unique code or name (str)
        :return: Data or None
        """
        if type(identifier) is str:
            entry_id = self.cache_name_to_id
        else:
            entry_id = identifier

        return self.cache.get(entry_id)
