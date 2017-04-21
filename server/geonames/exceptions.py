# -*- coding: utf-8; -*-
#
# @file exceptions.py
# @brief 
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
Source code from yourlabs/django-cities-light (exceptions.py)
forked from coderholic/django-cities

"""

from __future__ import unicode_literals


class CitiesLightException(Exception):
    """ Base exception class for this app's exceptions. """
    pass


class InvalidItems(CitiesLightException):
    """
    The cities_light command will skip item if a city_items_pre_import signal
    reciever raises this exception.
    """
    pass


class SourceFileDoesNotExist(CitiesLightException):
    """ A source file could not be found. """
    def __init__(self, source):
        super(SourceFileDoesNotExist, self).__init__('%s does not exist' % source)

