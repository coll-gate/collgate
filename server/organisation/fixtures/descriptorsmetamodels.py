# -*- coding: utf-8 -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC


"""
Setup the value for the organisation meta-models and types of models of descriptors.
"""

import json
import sys

from descriptor.models import DescriptorMetaModel, DescriptorPanel


def fixture():
    sys.stdout.write(" + Create organisation meta-models...\n")
