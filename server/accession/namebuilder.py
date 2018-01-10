# -*- coding: utf-8; -*-
#
# @file batchnamebuilder
# @brief Construct a new batch name using a specific convention and some constraints
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-01-08
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from datetime import datetime
from django.db import connection

from organisation.models import GRC


class NamingType(object):
    """
    Base naming type class.
    """

    SEQUENCE = 0    # Integer auto-increment based sequence (only one's possible)
    STATIC = 1      # Static string part
    CONSTANT = 2    # Constant string (can be used anywhere, prefix, middle, suffix)
    MDAY = 3        # Day of the month 1..31
    MONTH = 4       # Month of the year 1..12
    YEAR = 5        # Four digits year
    GRC_ID = 6      # GRC name identifier

    def __init__(self, naming_type, pos):
        self._type = naming_type
        self._pos = pos

    @property
    def type(self):
        return self._type

    def value(self, constants):
        return ""


class NamingTypeSequence(NamingType):
    """
    Serial naming type
    """

    def __init__(self, pos, sequence_name, digits=6):
        super().__init__(NamingType.SEQUENCE, pos)
        self.sequence_name = sequence_name
        self.format = "%%.0%ii" % digits

    def value(self, constants):
        acc_seq = "SELECT nextval('%s')" % self.sequence_name

        with connection.cursor() as cursor:
            cursor.execute(acc_seq)
            v = cursor.fetchone()[0]

        return self.format % v


class NamingTypeStatic(NamingType):
    """
    Serial naming type
    """

    def __init__(self, pos, text):
        super().__init__(NamingType.STATIC, pos)
        self.text = text

    def value(self, constants):
        return self.text


class NamingTypeConstant(NamingType):
    """
    Constant string naming type
    """

    def __init__(self, pos, index):
        super().__init__(NamingType.CONSTANT, pos)
        self._index = index

    def value(self, constants):
        if self._index < len(constants):
            return constants[self._index]
        else:
            raise ValueError("Missing constant")


class NamingTypeMonthDay(NamingType):
    """
    Day of the month naming type
    """

    def __init__(self, pos):
        super().__init__(NamingType.MDAY, pos)

    def value(self, constants):
        day = datetime.today().day
        return "%.2i" % day


class NamingTypeMonth(NamingType):
    """
    Month naming type
    """

    def __init__(self, pos):
        super().__init__(NamingType.MONTH, pos)

    def value(self, constants):
        month = datetime.today().month
        return "%.2i" % month


class NamingTypeYear(NamingType):
    """
    Year of the month naming type
    """

    def __init__(self, pos):
        super().__init__(NamingType.YEAR, pos)

    def value(self, constants):
        year = datetime.today().year
        return "%.4i" % year


class NamingTypeGRCNameId(NamingType):
    """
    GRC name identifier string naming type
    """

    def __init__(self, pos):
        super().__init__(NamingType.GRC_ID, pos)

    def value(self, constants):
        return GRC.objects.get_unique_grc().identifier


class NameBuilder(object):

    # Some examples of naming
    SIMPLE_SERIAL = "{SEQUENCE.6}"
    PREFIXED_SERIAL = "{CONSTANT}_{SERIAL.6}"
    PREFIXED_SERIAL_WITH_DATE = "{CONSTANT}_{SEQUENCE.6}_{YEAR}{MONTH}{MDAY}"

    def __init__(self, sequence_name, builder_format=None):
        if not builder_format:
            self._naming_format = NameBuilder.PREFIXED_SERIAL_WITH_DATE
        else:
            self._naming_format = builder_format

        # count the name of constants string necessary
        self._num_constants = self._naming_format.count("{CONSTANT}")
        self._recipe = []

        sp = -1
        i = 0
        pos = 0
        cidx = 0

        st = ""
        np = ""

        for c in self._naming_format:
            if c is '{':
                if len(st) > 0:
                    self._recipe.append(NamingTypeStatic(pos, st))
                    st = ""
                    pos += 1

                sp = i
                np = ""
            elif c is '}' and sp >= 0:
                sp = -1
                parts = np.split('.')

                if parts[0] == "SEQUENCE":
                    if len(parts) == 1:
                        self._recipe.append(NamingTypeSequence(pos, sequence_name, -1))
                    elif len(parts) == 2:
                        width = int(parts[1])
                        self._recipe.append(NamingTypeSequence(pos, sequence_name, width))
                elif parts[0] == "CONSTANT":
                    self._recipe.append(NamingTypeConstant(pos, cidx))
                    cidx += 1
                elif parts[0] == "MDAY":
                    self._recipe.append(NamingTypeMonthDay(pos))
                elif parts[0] == "MONTH":
                    self._recipe.append(NamingTypeMonth(pos))
                elif parts[0] == "YEAR":
                    self._recipe.append(NamingTypeYear(pos))
                elif parts[0] == "GRC_ID":
                    self._recipe.append(NamingTypeGRCNameId(pos))
                else:
                    pass

                pos += 1
            elif sp >= 0:
                np += c
            else:
                st += c

            i += 1

        # last suffix
        if len(st) > 0:
            self._recipe.append(NamingTypeStatic(pos, st))

    @property
    def num_constants(self):
        """
        Return the number of necessary constants parameters.
        """
        return self._num_constants

    def pick(self, constants=()):
        """
        Pick the next name.
        :param constants: List of ordered constants string.
        :return: A newly generated name. After that serial if used is incremented
        """
        name = ""

        for p in self._recipe:
            name += p.value(constants)

        return name


# instance of batch name builder per GRC id
batch_name_builder = {}

# instance of accession name builder per GRC id
accession_name_builder = {}
