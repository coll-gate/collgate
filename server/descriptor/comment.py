# -*- coding: utf-8; -*-
#
# @file comment.py
# @brief entity comment management
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-07-06
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import uuid

from django.core.exceptions import SuspiciousOperation
from django.utils.translation import ugettext_lazy as _


class CommentController(object):

    def __init__(self, entity):
        self.entity = entity

    def list_comments(self, order_by):
        comment_items = []

        for cid, comment in self.entity.comments.items():
            comment_items.append({
                'id': cid,
                'label': comment['label'],
                'value': comment['value']
            })

        # sort by label
        if '-label' in order_by:
            comment_items.sort(key=lambda c: c['label'], reverse=True)
        else:
            comment_items.sort(key=lambda c: c['label'])

        return {
            'items': comment_items,
            'perms': [],
            'prev': None,  # cq.prev_cursor,
            'cursor': None,  # cursor,
            'next': None  # cq.next_cursor
        }

    def add_comment(self, label, value):
        for cid, comment in self.entity.comments.items():
            if comment['label'] == label:
                raise SuspiciousOperation(_("Comment label already exists. Try another."))

        comment_uuid = str(uuid.uuid4())
        self.entity.comments[comment_uuid] = {
            'label': label,
            'value': value
        }

        self.entity.update_field('comments')
        self.entity.save()

        result = {'id': comment_uuid, 'label': label, 'value': value}
        return result

    def remove_comment(self, uuid):
        if uuid in self.entity.comments:
            del self.entity.comments[uuid]
        else:
            raise SuspiciousOperation(_("Comment does not exists."))

        self.entity.save()

    def update_comment(self, uuid, label, value):
        comment = self.entity.comments.get(uuid)

        if comment is None:
            raise SuspiciousOperation(_("Comment does not exists."))

        for cid, comment in self.entity.comments.items():
            if comment['label'] == label and cid != uuid:
                raise SuspiciousOperation(_("Comment label already exists. Try another."))

        # update comments
        comment['label'] = label
        comment['value'] = value

        self.entity.update_field('comments')
        self.entity.save()

        result = {'id': uuid, 'label': label, 'value': value}
        return result
