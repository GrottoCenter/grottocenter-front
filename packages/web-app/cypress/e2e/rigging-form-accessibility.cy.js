describe('Rigging counter accessibility and responsive actions', () => {
  [1280, 390].forEach(width => {
    it(`keeps stable errors and matching visual/keyboard order at ${width}px`, () => {
      cy.viewport(1280, 900);
      cy.mockApiCatchAll();
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/languages' },
        {
          body: { languages: [{ id: 'eng', part1: 'en', refName: 'English' }] }
        }
      );
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/entrances/42' },
        {
          body: {
            id: 42,
            name: 'Rigging form test entrance',
            isDeleted: false,
            documents: [],
            massifs: [],
            locations: [],
            descriptions: [],
            histories: [],
            comments: [],
            riggings: [
              {
                id: 1,
                title: 'Test rigging',
                language: 'eng',
                isDeleted: false,
                obstacles: [
                  {
                    obstacle: 'a'.repeat(849),
                    rope: 'r'.repeat(999),
                    anchor: '',
                    observation: ''
                  },
                  {
                    obstacle: 'b'.repeat(849),
                    rope: 's'.repeat(999),
                    anchor: '',
                    observation: ''
                  }
                ]
              }
            ]
          }
        }
      );
      cy.loginAs();
      cy.visit('/entrances/42');
      cy.get('#rigging').within(() => {
        cy.get('button[aria-label="Edit"]').click();
      });
      cy.viewport(width, 900);
      cy.get('[data-testid="rigging-form"]').within(() => {
        cy.get('table').should('have.length', width < 900 ? 0 : 1);
        cy.get('[data-testid="rigging-column-counter-obstacle"]')
          .should('contain.text', '1701 / 2000')
          .find('span')
          .first()
          .should('have.css', 'text-transform', 'capitalize');
        cy.get('[data-testid="rigging-column-counter-rope"] [role="alert"]')
          .should('have.text', 'This column exceeds the 2000-character limit.')
          .invoke('attr', 'id')
          .then(id => {
            cy.get('textarea[aria-label="Rope"]:not([aria-hidden])').should(
              'have.attr',
              'aria-describedby',
              id
            );
            // Oversized prefilled textareas can be taller than the viewport.
            cy.get('textarea[name="obstacles.1.rope"]:not([aria-hidden])').type(
              '{end}s',
              { force: true }
            );
            cy.get('[data-testid="rigging-column-counter-rope"]')
              .should('contain.text', '2002 / 2000')
              .find('[role="alert"]')
              .should('have.attr', 'id', id)
              .and(
                'have.text',
                'This column exceeds the 2000-character limit.'
              );
          });
        cy.get('textarea[name="obstacles.1.rope"]:not([aria-hidden])').type(
          '{end}{backspace}{backspace}',
          { force: true }
        );
        cy.get('[role="alert"]').should('not.exist');
        cy.get('textarea[aria-label="Rope"]:not([aria-hidden])').should(
          'not.have.attr',
          'aria-describedby'
        );
        cy.get('button[type="submit"]').should('be.enabled');
        cy.get('button[type="submit"]').parent().as('actions');
        cy.get('@actions').should($row => {
          const row = $row[0];
          const style = getComputedStyle(row);
          expect(style.gap).to.equal('8px');
          expect(style.marginTop).to.equal('24px');
          expect(style.marginBottom).to.equal('16px');
          const buttons = [...row.querySelectorAll('button')];
          expect(buttons.map(button => button.textContent)).to.deep.equal(
            width < 600 ? ['Update', 'Cancel'] : ['Cancel', 'Update']
          );
          const [first, second] = buttons.map(button =>
            button.getBoundingClientRect()
          );
          if (width < 600) {
            expect(second.top - first.bottom).to.be.closeTo(8, 1);
            expect(first.width).to.be.closeTo(row.clientWidth, 1);
            expect(second.width).to.be.closeTo(row.clientWidth, 1);
          } else {
            expect(second.left - first.right).to.be.closeTo(8, 1);
            expect(second.right).to.be.closeTo(
              row.getBoundingClientRect().right,
              1
            );
          }
        });
        cy.get('@actions').find('button').first().focus();
        cy.press(Cypress.Keyboard.Keys.TAB);
        cy.get('@actions').find('button').last().should('be.focused');
        cy.then(async () => {
          const params = {
            key: 'Tab',
            code: 'Tab',
            windowsVirtualKeyCode: 9,
            modifiers: 8
          };
          await Cypress.automation('remote:debugger:protocol', {
            command: 'Input.dispatchKeyEvent',
            params: { ...params, type: 'keyDown' }
          });
          await Cypress.automation('remote:debugger:protocol', {
            command: 'Input.dispatchKeyEvent',
            params: { ...params, type: 'keyUp' }
          });
        });
        cy.get('@actions').find('button').first().should('be.focused');
      });
      cy.document().should(doc => {
        expect(doc.documentElement.scrollWidth).to.be.at.most(
          doc.documentElement.clientWidth
        );
      });
    });
  });
});
