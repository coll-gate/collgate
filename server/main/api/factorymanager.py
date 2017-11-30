# -*- coding: utf-8; -*-
#
# @file factorymanager.py
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-11-30
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 


class FactoryManager(object):

    def __init__(self):
        self.factories = {}

    def register(self, _factory):
        if _factory:
            if _factory in self.factories:
                raise Exception("Already registered factory %s" % _factory.name)

            self.factories[_factory.name] = _factory

    def factory(self, name):
        """
        Retuns a previously registered factory.
        :param name: Name of the factory.
        :return: A valid factory instance or None
        """
        lfactory = self.factories.get(name)
        return lfactory

    #
    # singleton
    #

    __instance = None

    @staticmethod
    def instance():
        if FactoryManager.__instance is None:
            FactoryManager.__instance = FactoryManager()

        return FactoryManager.__instance

    @staticmethod
    def destroy():
        if FactoryManager.__instance is not None:
            del FactoryManager.__instance
