import { guessAuthorName } from './guessAuthorName';

it.each([
  ['Jean Dupont', 'DUPONT', 'Jean'],
  ['DUPONT Jean', 'DUPONT', 'Jean'],
  ['Jean DUPONT', 'DUPONT', 'Jean'],
  ['Dupont, Jean-Pierre', 'DUPONT', 'Jean-Pierre'],
  ['DE BEAUNE Sophie', 'DE BEAUNE', 'Sophie'],
  ['Sophie A. DE BEAUNE', 'A. DE BEAUNE', 'Sophie'],
  ['A. DE BEAUNE Sophie', 'A. DE BEAUNE', 'Sophie'],
  ['Sophie de Beaune', 'DE BEAUNE', 'Sophie'],
  ['DE BEAUNE, Sophie A.', 'DE BEAUNE', 'Sophie A.'],
  ['Jean de la Fontaine', 'DE LA FONTAINE', 'Jean'],
  ['PIÉRARD GE.', 'PIÉRARD', 'GE.'],
  ['DUPONT J.-P.', 'DUPONT', 'J.-P.'],
  ['PINHEIRO J.R. Gilmar', 'PINHEIRO', 'J.R. Gilmar'],
  ['Élodie MARTIN', 'MARTIN', 'Élodie'],
  ['Jean O’Neill', 'O’NEILL', 'Jean'],
  ['DUPONT JEAN', 'DUPONT', 'JEAN'],
  ['DE BEAUNE SOPHIE', 'DE BEAUNE', 'SOPHIE'],
  ['PLANTU', 'PLANTU', ''],
  ['   Jean  \n Dupont   ', 'DUPONT', 'Jean'],
  ['', '', '']
])('suggests editable names for %s', (input, surname, name) => {
  expect(guessAuthorName(input)).toEqual({ surname, name });
});
