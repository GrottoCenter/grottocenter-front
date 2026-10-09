describe('Numeric limits in entrance forms', () => {
  it('blocks invalid values on submit and submits corrected integer boundaries', () => {
    cy.viewport(1280, 900);
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      { body: { languages: [{ id: 'eng', part1: 'en', refName: 'English' }] } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/42' },
      {
        body: {
          id: 42,
          name: 'Test entrance',
          language: 'eng',
          latitude: 45,
          longitude: 6,
          altitude: 10000,
          discoveryYear: -10000,
          isSensitive: false,
          cave: {
            id: 7,
            name: 'Test entrance',
            language: 'eng',
            depth: 20001,
            length: 100000001,
            temperature: 10,
            entrances: [{ id: 42 }]
          }
        }
      }
    );
    cy.intercept(
      { method: 'PUT', pathname: '/api/v1/entrances/42' },
      { statusCode: 500 }
    ).as('saveEntrance');
    cy.intercept(
      { method: 'PUT', pathname: '/api/v1/caves/7' },
      { statusCode: 500 }
    ).as('saveCave');
    cy.loginAs();
    cy.visit('/entrances/42/edit', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });

    const fields = [
      ['entrance.altitude', -9999, 9999],
      ['cave.depth', 0, 20000],
      ['cave.length', 0, 100000000],
      ['entrance.yearDiscovery', -9999, new Date().getFullYear()]
    ];
    fields.forEach(([name, min, max]) => {
      cy.get(`input[name="${name}"]`)
        .should('have.attr', 'type', 'number')
        .and('have.attr', 'min', String(min))
        .and('have.attr', 'max', String(max))
        .and('have.attr', 'step', '1')
        .and('have.attr', 'aria-invalid', 'false')
        .and('not.have.attr', 'maxlength');
    });
    cy.contains('button', 'Update').click();
    fields.forEach(([name]) => {
      cy.get(`input[name="${name}"]`).should(
        'have.attr',
        'aria-invalid',
        'true'
      );
    });
    cy.focused().should('have.attr', 'name', 'entrance.altitude');
    cy.get('@saveEntrance.all').should('have.length', 0);
    cy.get('@saveCave.all').should('have.length', 0);

    cy.get('input[name="entrance.altitude"]').clear();
    cy.get('input[name="entrance.altitude"]').type('-9999');
    cy.get('input[name="cave.depth"]').clear();
    cy.get('input[name="cave.depth"]').type('20000');
    cy.get('input[name="cave.length"]').clear();
    cy.get('input[name="cave.length"]').type('100000000');
    cy.get('input[name="entrance.yearDiscovery"]').clear();
    cy.get('input[name="entrance.yearDiscovery"]').type('-9999');
    fields.forEach(([name]) => {
      cy.get(`input[name="${name}"]`).should(
        'have.attr',
        'aria-invalid',
        'false'
      );
    });
    cy.contains('button', 'Update').click();
    cy.wait('@saveEntrance').its('request.body').should('include', {
      altitude: -9999,
      yearDiscovery: -9999
    });
    cy.wait('@saveCave').its('request.body').should('include', {
      depth: 20000,
      length: 100000000
    });
  });
});
