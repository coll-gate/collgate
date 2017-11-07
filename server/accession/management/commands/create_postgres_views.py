# -*- coding: utf-8;-*-
#
# @file postgresviews.py
# @brief Create necessary postgres views
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2017-10-16
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.core.management.base import BaseCommand
from django.db import connection, transaction


class Command(BaseCommand):
    help = "Create necessary postgres views in database."

    @transaction.atomic()
    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Accession view
            cursor.execute(
                """CREATE OR REPLACE VIEW accession_panel_list AS SELECT * FROM (SELECT DISTINCT A.*,ARRAY(SELECT AP.accessionpanel_id FROM accession_accessionpanel_accessions AP WHERE AP.accession_id = A.id) AS panels FROM accession_accession A) T ORDER BY panels;"""
            )

            # Batch view
            cursor.execute(
                """CREATE OR REPLACE VIEW batch_panel_list AS SELECT * FROM (SELECT DISTINCT A.*, ARRAY(SELECT AP.batchpanel_id FROM accession_batchpanel_batches AP WHERE AP.batch_id = A.id) AS panels FROM accession_batch A) T ORDER BY panels;"""
            )
