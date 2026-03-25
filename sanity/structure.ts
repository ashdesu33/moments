import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {ImagesIcon} from '@sanity/icons'
import type {StructureResolver} from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      orderableDocumentListDeskItem({
        type: 'project',
        title: 'Projects',
        icon: ImagesIcon,
        S,
        context,
      }),
      ...S.documentTypeListItems().filter((item) => item.getId() !== 'project'),
    ])
