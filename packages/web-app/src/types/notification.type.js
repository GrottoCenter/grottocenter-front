import { number, string, shape, oneOf, arrayOf } from 'prop-types';
import idNameType from './idName.type';

const notificationType = shape({
  id: number.isRequired,
  dateInscription: string.isRequired,
  notifier: shape({
    id: number.isRequired,
    nickname: string.isRequired
  }),
  notificationType: shape({
    id: number.isRequired,
    name: oneOf([
      'CREATE',
      'DELETE',
      'IMPORT_COMPLETE',
      'PERMANENT_DELETE',
      'REJECT',
      'RESTORE',
      'UPDATE',
      'VALIDATE'
    ])
  }),
  cave: idNameType,
  description: shape({
    id: number.isRequired,
    body: string.isRequired,
    title: string.isRequired,
    cave: shape({
      id: number.isRequired
    }),
    document: shape({
      id: number.isRequired
    }),
    entrance: shape({
      id: number.isRequired
    }),
    massif: shape({
      id: number.isRequired
    })
  }),
  document: shape({
    id: number.isRequired,
    author: idNameType,
    titles: arrayOf(
      shape({
        id: number.isRequired,
        titles: arrayOf(
          shape({
            id: number.isRequired,
            text: string.isRequired
          })
        )
      })
    )
  }),
  entrance: idNameType,
  location: shape({
    id: number.isRequired,
    author: idNameType,
    body: string.isRequired,
    title: string.isRequired,
    entrance: shape({
      id: number.isRequired
    })
  }),
  massif: idNameType
});

export default notificationType;
