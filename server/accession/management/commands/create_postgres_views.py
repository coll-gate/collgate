# -*- coding: utf-8;-*-
#
# @file postgresviews.py
# @brief
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2017-10-16
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details


from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Create postgres views in database."

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            cursor.execute(
                "CREATE OR REPLACE VIEW accession_panelslist AS SELECT * FROM (SELECT DISTINCT A.*,ARRAY(SELECT AP.accessionpanel_id FROM accession_accessionpanel_accessions AP WHERE AP.accession_id = A.id) AS panels FROM accession_accession A) T ORDER BY panels;"
            )
