# -*- coding: utf-8; -*-
#
# @file models.py
# @brief coll-gate messenger server application models.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-10-11
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import logging

from django.db import models

logger = logging.getLogger('collgate-messenger')


class Settings(models.Model):
    """
    Global setting table.
    """

    param_name = models.CharField(max_length=127)
    value = models.CharField(max_length=1024)
