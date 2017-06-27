# -*- coding: utf-8;-*-
#
# @file add_event_message.py
# @brief Add event message on the home page
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2017-06-23
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.core.management.base import BaseCommand
from main.models import EventMessage
from django.contrib.auth.models import User
from django.db import transaction
import json


class Command(BaseCommand):
    help = """Add an event message on the home page of Collgate application"""

    def add_arguments(self, parser):
        parser.add_argument(
            'message',
            nargs='+',
            type=str,
            help="Defines the message added to the events panel like '{'language_code(2 chars)': 'message', ...}'."
        )
        parser.add_argument(
            '-u', '--user',
            dest='username',
            default='root',
            help='Defines the username used for audit operations.'
        )

    @transaction.atomic()
    def handle(self, *args, **options):
        msg_arg_len = len(options['message'])
        if msg_arg_len % 2 != 0:
            raise IndexError(
                'Message argument must be like the following format: [ language_code_1(2 chars) "message_1" ... language_code_n(2 chars) "message_n" ]')
        i = 0
        n = msg_arg_len - 1
        data = {}

        while i < n:
            language = options['message'][i]
            if len(language) != 2:
                raise ValueError('[%s] is not a 2 letters language code' % language)
            message = options['message'][i + 1]
            data[language] = message
            i += 2

        author = User.objects.get(username=options['username'])
        EventMessage.objects.create(
            author=author,
            message=json.dumps(data)
        )
