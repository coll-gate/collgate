# -*- coding: utf-8; -*-
#
# @file batchnamebuilder
# @brief Construct a new batch name using a specific convention and some constraints
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-01-08
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import time

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
    VARIABLE = 3    # Variable string (from a choice)
    MDAY = 4        # Day of the month 1..31
    MONTH = 5       # Month of the year 1..12
    YEAR = 6        # Four digits year
    GRC_ID = 7      # GRC name identifier
    HASH = 8        # Hash string generation based on a sequence as seed and CRC-15

    def __init__(self, naming_type, pos):
        self._type = naming_type
        self._pos = pos

    @property
    def type(self):
        return self._type

    def value(self, variables, constants):
        return ""


class NamingTypeSequence(NamingType):
    """
    Sequence naming type
    """

    def __init__(self, pos, sequence_name, digits=6):
        super().__init__(NamingType.SEQUENCE, pos)
        self.sequence_name = sequence_name
        self.format = "%%.0%ii" % digits

    def value(self, variables, constants):
        acc_seq = "SELECT nextval('%s')" % self.sequence_name

        with connection.cursor() as cursor:
            cursor.execute(acc_seq)
            v = cursor.fetchone()[0]

        return self.format % v


class NamingTypeHash(NamingType):
    """
    Hash naming type
    """

    SYMBOLS = []

    @classmethod
    def init(cls):
        cls.SYMBOLS = []

        # 10 digits
        for i in range(0, 10):
            cls.SYMBOLS.append(chr(ord('0') + i))

        # 22 letters
        for i in range(0, 26):
            # ignore I,L,O,U
            if i not in (8, 11, 14, 20):
                cls.SYMBOLS.append(chr(ord('A') + i))

    @classmethod
    def crc15(cls, seed):
        # nanoseconds time 64 bits
        now = int(time.time() * 1000 * 1000)
        v = [
            (seed & 0xff00000000000000) >> 7,
            (seed & 0x00ff000000000000) >> 6,
            (seed & 0x0000ff0000000000) >> 5,
            (seed & 0x000000ff00000000) >> 4,
            (seed & 0x00000000ff000000) >> 3,
            (seed & 0x0000000000ff0000) >> 2,
            (seed & 0x000000000000ff00) >> 1,
            (seed & 0x00000000000000ff),
            (now & 0xff00000000000000) >> 7,
            (now & 0x00ff000000000000) >> 6,
            (now & 0x0000ff0000000000) >> 5,
            (now & 0x000000ff00000000) >> 4,
            (now & 0x00000000ff000000) >> 3,
            (now & 0x0000000000ff0000) >> 2,
            (now & 0x000000000000ff00) >> 1,
            (now & 0x00000000000000ff)
        ]

        crc = 0
        for i in range(0, 16):
            crc ^= v[i] << 7
            for j in range(0, 8):
                crc <<= 1
                if crc & 0x8000:
                    crc ^= 0xC599

            crc &= 0x7fff

        return crc

    @classmethod
    def to_base32(cls, x):
        """
        Crockford's base 32 plus 1 bits
        """
        res = ""

        if x == 0:
            return ""

        if x & 0x8000:
            res += "1"

        if x > 0x03E0:
            x1 = (x & 0x7C00) >> 10
            res += cls.SYMBOLS[x1]

        if x > 0x001F:
            x1 = (x & 0x03E0) >> 5
            res += cls.SYMBOLS[x1]

        x1 = x & 0x001F
        res += cls.SYMBOLS[x1]

        return res

    def __init__(self, pos, sequence_name, length=3):
        super().__init__(NamingType.HASH, pos)
        self.sequence_name = sequence_name
        self.length = length

        if length != 3:
            raise ValueError("Only max length of 3 is supported")

    def value(self, variables, constants):
        acc_seq = "SELECT nextval('%s')" % self.sequence_name

        with connection.cursor() as cursor:
            cursor.execute(acc_seq)
            v = cursor.fetchone()[0]

        # generate a crc-15 based on the current time and unique seed
        crc15 = NamingTypeHash.crc15(v)

        # return a 3 chars max string from the crc15
        return NamingTypeHash.to_base32(crc15)


class NamingTypeStatic(NamingType):
    """
    Serial naming type
    """

    def __init__(self, pos, text):
        super().__init__(NamingType.STATIC, pos)
        self.text = text

    def value(self, variables, constants):
        return self.text


class NamingTypeConstant(NamingType):
    """
    Constant string naming type
    """

    def __init__(self, pos, index):
        super().__init__(NamingType.CONSTANT, pos)
        self._index = index

    def value(self, variables, constants):
        if self._index < len(constants):
            return constants[self._index]
        else:
            raise ValueError("Missing constant")


class NamingTypeVariable(NamingType):
    """
    Variable (from a choice) string naming type
    """

    def __init__(self, pos, var_name):
        super().__init__(NamingType.VARIABLE, pos)

        if var_name not in ('GRC_CODE', 'ACCESSION_CODE', 'ACCESSION_NAME'):
            raise ValueError("Unsupported variable name " + var_name)

        self._var_name = var_name

    def value(self, variables, constants):
        v = variables.get(self._var_name, "")
        if v is not None:
            return v
        else:
            raise ValueError("Missing variable")


class NamingTypeMonthDay(NamingType):
    """
    Day of the month naming type
    """

    def __init__(self, pos):
        super().__init__(NamingType.MDAY, pos)

    def value(self, variables, constants):
        day = datetime.today().day
        return "%.2i" % day


class NamingTypeMonth(NamingType):
    """
    Month naming type
    """

    def __init__(self, pos):
        super().__init__(NamingType.MONTH, pos)

    def value(self, variables, constants):
        month = datetime.today().month
        return "%.2i" % month


class NamingTypeYear(NamingType):
    """
    Year of the month naming type
    """

    def __init__(self, pos):
        super().__init__(NamingType.YEAR, pos)

    def value(self, variables, constants):
        year = datetime.today().year
        return "%.4i" % year


class NamingTypeGRCCode(NamingType):
    """
    GRC name identifier string naming type
    """

    def __init__(self, pos):
        super().__init__(NamingType.GRC_ID, pos)

    def value(self, variables, constants):
        return GRC.objects.get_unique_grc().identifier


class NameBuilder(object):

    # Some examples of naming
    SIMPLE_SERIAL = "{SEQ.6}"
    PREFIXED_SERIAL = "{CONST}_{SERIAL.6}"
    PREFIXED_SERIAL_WITH_DATE = "{CONST}_{SEQ.6}_{YEAR}{MONTH}{MDAY}"

    def __init__(self, sequence_name, builder_format=None):
        if not builder_format:
            self._naming_format = NameBuilder.PREFIXED_SERIAL_WITH_DATE
        else:
            self._naming_format = builder_format

        # count the name of constants string necessary
        self._num_constants = self._naming_format.count("{CONST}")
        self._recipe = []

        sp = -1
        i = 0
        pos = 0
        const_idx = 0

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

                if parts[0] == "SEQ":
                    if len(parts) == 1:
                        self._recipe.append(NamingTypeSequence(pos, sequence_name, -1))
                    elif len(parts) == 2:
                        width = int(parts[1])
                        self._recipe.append(NamingTypeSequence(pos, sequence_name, width))
                elif parts[0] == "CONST":
                    self._recipe.append(NamingTypeConstant(pos, const_idx))
                    const_idx += 1
                elif parts[0] == "VAR":
                    if len(parts) == 1:
                        raise ValueError("Missing variable name")
                    self._recipe.append(NamingTypeVariable(pos, parts[1]))
                elif parts[0] == "MDAY":
                    self._recipe.append(NamingTypeMonthDay(pos))
                elif parts[0] == "MONTH":
                    self._recipe.append(NamingTypeMonth(pos))
                elif parts[0] == "YEAR":
                    self._recipe.append(NamingTypeYear(pos))
                elif parts[0] == "GRC_CODE":
                    self._recipe.append(NamingTypeGRCCode(pos))
                elif parts[0] == "HASH":
                    if len(parts) == 1:
                        self._recipe.append(NamingTypeHash(pos, sequence_name))
                    elif len(parts) == 2:
                        max_length = int(parts[1])
                        self._recipe.append(NamingTypeHash(pos, sequence_name, max_length))
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

    def pick(self, variables=None, constants=None):
        """
        Pick the next name.
        :param variables: Named standardized variable dict.
        :param constants: List of ordered constants string.
        :return: A newly generated name. After that serial if used is incremented
        """
        if variables is None:
            variables = {}

        if constants is None:
            constants = []

        name = ""

        for p in self._recipe:
            name += p.value(variables, constants)

        return name


class NameBuilderManager(object):

    GLOBAL_ACCESSION = "accession"
    GLOBAL_BATCH = "batch"

    builders = {}

    @classmethod
    def init(cls):
        NamingTypeHash.init()

    @classmethod
    def register(cls, name, builder):
        if name in cls.builders:
            raise ValueError("Already defined name builder for this name")

        cls.builders[name] = builder

    @classmethod
    def get(cls, name):
        return cls.builders.get(name)

    @classmethod
    def has(cls, name):
        return name in cls.builders
