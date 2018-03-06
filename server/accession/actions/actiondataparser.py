# -*- coding: utf-8; -*-
#
# @file parsedata
# @brief Parsing of CSV and XLSX tables of input for actions
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-03-06
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

import xlsxwriter


class ActionDataParser(object):

    def __init__(self):
        self._data = []

    @property
    def data(self):
        return self.data

    def parse_csv(self, buffer):
        header = buffer.readline()

        # content
        for line in buffer:
            print(line)

    def parse_xlsx(self, buffer):
        pass
