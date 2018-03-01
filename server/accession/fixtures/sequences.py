# -*- coding: utf-8; -*-
#
# @file sequences
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-01-09
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 


def fixture(fixture_manager, factory_manager):

    acc_seq = "CREATE SEQUENCE IF NOT EXISTS accession_naming_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;"
    bat_seq = "CREATE SEQUENCE IF NOT EXISTS batch_naming_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;"

    from django.db import connection

    with connection.cursor() as cursor:
        cursor.execute(acc_seq)
        cursor.execute(bat_seq)
