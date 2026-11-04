const visitForm = path => {
  cy.loginAs();
  cy.visit(path, {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', 'en');
    }
  });
};

const selectType = type => {
  cy.get('[data-testid="organization-type-field"] [role="combobox"]').click();
  cy.get(`[data-testid="type-${type}"]`).click();
};

describe('Required organization classification', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      {
        body: {
          languages: [
            { id: 'eng', part1: 'en', refName: 'English' },
            { id: 'fra', part1: 'fr', refName: 'French' }
          ]
        }
      }
    );
  });

  [
    [1280, 900, 'desktop'],
    [390, 844, 'mobile']
  ].forEach(([width, height, viewport]) => {
    it(`preserves the classic organization form layout on ${viewport}`, () => {
      cy.viewport(width, height);
      visitForm('/entity/add/organization');
      cy.get('[data-testid="organization-name"]', { timeout: 30000 }).should(
        'be.visible'
      );
      cy.contains('[role="combobox"]', 'English').should('exist');
      cy.get('[name="organization.name"]').should(
        'not.have.attr',
        'aria-invalid',
        'true'
      );
      cy.get('[name="organization.country"]').should('have.value', 'FR');
      cy.contains('label', 'Country').should('not.contain.text', '*');
      cy.get('[data-testid="organization-name"]').then($name => {
        const name = $name[0].getBoundingClientRect();
        cy.contains('label', 'Language')
          .parent()
          .should($language => {
            const language = $language[0].getBoundingClientRect();
            if (viewport === 'desktop') {
              expect(language.top).to.be.closeTo(name.top, 1);
              expect(language.left).to.be.greaterThan(name.left);
            } else {
              expect(language.top).to.be.at.least(name.bottom);
            }
          });
      });
      cy.get('[name="organization.customMessage"]').should($message => {
        const message = $message[0].getBoundingClientRect();
        const mail = $message[0].ownerDocument
          .querySelector('[name="organization.mail"]')
          .getBoundingClientRect();
        expect(message.bottom).to.be.lessThan(mail.top);
      });
      cy.get('[name="organization.mail"]').then($mail => {
        const mail = $mail[0].getBoundingClientRect();
        cy.get('[name="organization.url"]').should($url => {
          const url = $url[0].getBoundingClientRect();
          if (viewport === 'desktop') {
            expect(url.top).to.be.closeTo(mail.top, 1);
          } else {
            expect(url.top).to.be.greaterThan(mail.bottom);
          }
        });
      });
      cy.get('[name="organization.zipCode"]').then($zip => {
        const zip = $zip[0].getBoundingClientRect();
        const zipField = $zip[0].parentElement.getBoundingClientRect();
        cy.get('[name="organization.city"]').should($city => {
          const city = $city[0].getBoundingClientRect();
          if (viewport === 'desktop') {
            expect(city.top).to.be.closeTo(zip.top, 1);
          } else {
            expect(city.top).to.be.greaterThan(zip.bottom);
          }
        });
        if (viewport === 'desktop') {
          cy.get('[name="organization.country"]').should($country => {
            const country = $country[0].parentElement.getBoundingClientRect();
            expect(country.top).to.be.closeTo(zipField.top, 1);
          });
        }
      });
      cy.get('[data-testid="coordinate-system-selector"]').should('exist');
      cy.screenshot(`classic-organization-form-${viewport}`);
    });
  });

  it('requires a type on creation and preserves values after API rejection', () => {
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/organizations' },
      {
        statusCode: 400,
        body: { code: 'organizationType.required', message: 'Type is required' }
      }
    ).as('createOrganization');
    visitForm('/entity/add/organization');
    cy.get('[data-testid="organization-name"] input').type('New organization');
    cy.get('[name="organization.customMessage"]').type('Test description');
    cy.contains('button', 'Create').click();
    cy.contains('Choose an organization type.').should('be.visible');
    cy.get('[data-testid="organization-type-field"] [role="combobox"]').should(
      'have.focus'
    );
    cy.get('@createOrganization.all').should('have.length', 0);

    selectType('RESEARCH');
    cy.contains('button', 'Create').click();
    cy.wait('@createOrganization')
      .its('request.body.type')
      .should('eq', 'RESEARCH');
    cy.get('[data-testid="organization-name"] input').should(
      'have.value',
      'New organization'
    );
    cy.get('[data-testid="organization-type-field"] [role="combobox"]').should(
      'contain',
      'Research organization'
    );

    selectType('OTHER');
    cy.contains('button', 'Create').click();
    cy.wait('@createOrganization')
      .its('request.body.type')
      .should('eq', 'OTHER');
    cy.get('[data-testid="organization-type-field"] [role="combobox"]').should(
      'contain',
      'Other'
    );
  });

  it('requires classification before saving the name and organization together', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/organizations/42' },
      {
        body: {
          id: 42,
          nameId: 17,
          name: 'Old organization',
          language: 'eng',
          type: null,
          country: 'FR',
          customMessage: 'Test description'
        }
      }
    );
    cy.intercept(
      { method: 'PATCH', pathname: '/api/v1/names/17' },
      { body: {} }
    ).as('updateName');
    cy.intercept(
      { method: 'PUT', pathname: '/api/v1/organizations/42' },
      {
        statusCode: 400,
        body: { message: 'Test rejection' }
      }
    ).as('updateOrganization');
    visitForm('/organizations/42/edit');
    cy.get('[data-testid="organization-name"] input').clear();
    cy.get('[data-testid="organization-name"] input').type(
      'Renamed organization'
    );
    cy.contains('button', 'Update').click();
    cy.contains('Choose an organization type.').should('be.visible');
    cy.get('@updateName.all').should('have.length', 0);
    cy.get('@updateOrganization.all').should('have.length', 0);
    selectType('OTHER');
    cy.contains('button', 'Update').click();
    cy.wait('@updateOrganization')
      .its('request.body')
      .should('include', { type: 'OTHER' })
      .and('have.property', 'name')
      .and('deep.equal', { text: 'Renamed organization', language: 'eng' });
    cy.get('@updateName.all').should('have.length', 0);
  });

  it('validates optional email and URL formats before creating an organization', () => {
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/organizations' },
      { statusCode: 400, body: { message: 'Test rejection' } }
    ).as('createOrganization');
    visitForm('/entity/add/organization');
    cy.get('[data-testid="organization-name"] input').type('New organization');
    cy.get('[name="organization.customMessage"]').type('Test description');
    selectType('SPELEOLOGY');
    cy.get('[name="organization.mail"]').type('bad-email');
    cy.get('[name="organization.url"]').type('bad-url');
    cy.contains('button', 'Create').click();
    cy.contains('The email must be valid.').should('be.visible');
    cy.contains('The URL must be valid.').should('be.visible');
    cy.get('@createOrganization.all').should('have.length', 0);
    cy.get('[name="organization.mail"]').clear();
    cy.get('[name="organization.mail"]').type('contact@example.org');
    cy.get('[name="organization.url"]').clear();
    cy.get('[name="organization.url"]').type('https://example.org');
    cy.contains('button', 'Create').click();
    cy.wait('@createOrganization').its('request.body').should('include', {
      mail: 'contact@example.org',
      url: 'https://example.org'
    });
  });

  it('lets users classify the name language without renaming the organization', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/organizations/42' },
      {
        body: {
          id: 42,
          nameId: 17,
          name: 'Old organization',
          language: '000',
          type: 'SPELEOLOGY',
          country: 'FR',
          customMessage: 'Test description'
        }
      }
    );
    cy.intercept(
      { method: 'PATCH', pathname: '/api/v1/names/17' },
      { body: {} }
    ).as('updateNameLanguage');
    cy.intercept(
      { method: 'PUT', pathname: '/api/v1/organizations/42' },
      { statusCode: 400, body: { message: 'Test rejection' } }
    ).as('saveOrganization');
    visitForm('/organizations/42/edit');
    cy.contains('[role="combobox"]', 'Select a language').click();
    cy.contains('[role="option"]', 'French').click();
    cy.contains('button', 'Update').click();
    cy.wait('@saveOrganization').its('request.body.name').should('deep.equal', {
      text: 'Old organization',
      language: 'fra'
    });
    cy.get('@updateNameLanguage.all').should('have.length', 0);
    cy.contains('[role="combobox"]', 'French').scrollIntoView();
    cy.contains('[role="combobox"]', 'French').should('be.visible');
  });
});
