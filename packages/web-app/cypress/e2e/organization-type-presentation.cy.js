const organization = type => ({
  id: 42,
  name: 'Example organization',
  type,
  nameId: 17,
  language: 'eng',
  author: { id: 11, nickname: 'OrganizationCreator' },
  reviewer: { id: 12, nickname: 'OrganizationEditor' },
  dateInscription: '2026-01-02T12:00:00Z',
  dateReviewed: '2026-03-04T12:00:00Z',
  customMessage: 'Description',
  country: 'FR',
  mail: 'contact@example.org',
  cavers: [{ id: 1, nickname: 'TestCaver' }],
  exploredEntrances: [{ id: 7, name: 'An entrance' }],
  exploredNetworks: [{ id: 8, name: 'A network', length: 100, depth: 10 }],
  authoredDocuments: [],
  publishedDocuments: [],
  authoredCount: 0,
  publishedCount: 0
});

const visit = (path, { usePseudoFullscreen = false } = {}) => {
  cy.loginAs();
  cy.visit(path, {
    onBeforeLoad: win => {
      if (usePseudoFullscreen) {
        // Cypress clicks cannot activate native fullscreen; use Leaflet's fallback.
        Object.defineProperty(win.document, 'fullscreenEnabled', {
          configurable: true,
          value: false
        });
      }
      win.localStorage.setItem('selectedLanguage', 'en');
      win.localStorage.setItem(
        'grottocenter_selectedLayers',
        JSON.stringify({
          entrances: true,
          networks: false,
          massifs: false,
          organizations: true
        })
      );
    }
  });
};

const expectOrganizationSummary = label => {
  cy.get('[data-testid="organization-summary"]').within(() => {
    cy.get('[data-testid="organization-type"]')
      .should('contain.text', 'Organization type')
      .and('contain.text', label)
      .find('img')
      .should('have.length', 1);
    cy.get('[data-testid="organization-type"]')
      .next()
      .should('have.attr', 'data-testid', 'organization-statistics');
  });
  cy.get('[data-testid="organization-contact"]').should('exist');
};

describe('Organization type presentation', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      {
        body: { languages: [{ id: 'eng', part1: 'en', refName: 'English' }] }
      }
    );
  });

  [
    ['EDITION', 'Publisher', false],
    ['RESEARCH', 'Research organization', true],
    [null, 'Type not specified', true]
  ].forEach(([type, label, hasExploration]) => {
    it(`adapts the organization page for ${type}`, () => {
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/organizations/42' },
        { body: organization(type) }
      );
      visit('/organizations/42');
      cy.get('[data-testid="organization-type-label"]').should(
        'have.text',
        label
      );
      expectOrganizationSummary(label);
      cy.get('[data-testid="organization-properties"]')
        .next()
        .should($metadata => {
          expect($metadata.text()).to.match(
            /Created by\s+OrganizationCreator 1\/2\/26/
          );
          expect($metadata.text()).to.match(
            /Updated by\s+OrganizationEditor 3\/4\/26/
          );
        })
        .and('contain.text', 'Language : ENG')
        .within(() => {
          cy.contains('a', 'OrganizationCreator').should(
            'have.attr',
            'href',
            '/ui/persons/11'
          );
          cy.contains('a', 'OrganizationEditor').should(
            'have.attr',
            'href',
            '/ui/persons/12'
          );
        });
      cy.get('h1').find('img').should('have.attr', 'alt', 'Organization');
      cy.get('h1').parent().parent().parent().should('not.contain.text', label);
      cy.get('[id="members"]').should(hasExploration ? 'exist' : 'not.exist');
      cy.get('[id="related-caves"]').should(
        hasExploration ? 'exist' : 'not.exist'
      );
      cy.get('img[alt="cavers"]').should(
        hasExploration ? 'exist' : 'not.exist'
      );
      cy.get('img[alt="networks"]').should(
        hasExploration ? 'exist' : 'not.exist'
      );
      cy.get('img[alt="entrances"]').should(
        hasExploration ? 'exist' : 'not.exist'
      );
      cy.screenshot(`organization-${type ?? 'unclassified'}`, {
        capture: 'viewport'
      });
    });
  });

  [390, 768, 1280, 1920].forEach(width => {
    it(`keeps the type first in the combined summary at ${width}px`, () => {
      cy.viewport(width, 900);
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/organizations/42' },
        { body: { ...organization('SPELEOLOGY'), latitude: 45, longitude: 5 } }
      );
      visit('/organizations/42', { usePseudoFullscreen: width === 390 });
      cy.get('[data-testid="organization-summary"]').scrollIntoView({
        offset: { top: -96, left: 0 }
      });
      expectOrganizationSummary('Caving group');
      cy.get('[data-testid="organization-type-label"]').should('be.visible');
      cy.get('[data-testid="organization-statistics"]').within(() => {
        ['Members', 'Documents', 'Networks', 'Entrances'].forEach(label => {
          cy.contains('span', label)
            .should('be.visible')
            .then($label => {
              const labelBox = $label[0].getBoundingClientRect();
              const valueBox =
                $label[0].nextElementSibling.getBoundingClientRect();
              expect(valueBox.top).to.be.at.least(labelBox.bottom);
            });
        });
      });
      cy.get('[data-testid="organization-type"]').then($type => {
        const type = $type[0].getBoundingClientRect();
        cy.get('[data-testid="organization-statistics"]').should($stats => {
          const stats = $stats[0].getBoundingClientRect();
          if (width === 390) {
            expect(stats.top).to.be.at.least(type.bottom);
          } else if (width === 1920) {
            expect(stats.left).to.be.at.least(type.right);
            expect(
              Math.abs(
                type.top + type.height / 2 - stats.top - stats.height / 2
              )
            ).to.be.lessThan(1);
          }
        });
      });
      cy.get('[data-testid="organization-map"]').then($map => {
        const map = $map[0].getBoundingClientRect();
        cy.get('[data-testid="organization-summary"]').should($summary => {
          const summary = $summary[0].getBoundingClientRect();
          if (width === 390) {
            expect(map.top).to.be.at.least(summary.bottom);
            expect(map.height).to.equal(240);
          } else {
            expect(summary.left).to.be.at.least(map.right);
          }
        });
      });
      cy.get('[data-testid="organization-statistics"]')
        .children()
        .should($items => {
          const items = [...$items].map(item => item.getBoundingClientRect());
          const icons = [...$items].map(item =>
            item.querySelector('img').getBoundingClientRect()
          );
          expect(items).to.have.length(4);
          expect(items[0].top).to.equal(items[1].top);
          expect(icons[0].top).to.equal(icons[1].top);
          expect(icons[2].top).to.equal(icons[3].top);
          if (width === 390 || width === 768) {
            expect(items[2].top).to.be.at.least(items[0].bottom);
            expect(items[2].top).to.equal(items[3].top);
          } else {
            expect(items[0].top).to.equal(items[3].top);
          }
        });
      cy.screenshot(`organization-summary-${width}`, { capture: 'viewport' });
      if (width === 390) {
        cy.get('[role="button"][aria-label="Full Screen"]').click();
        cy.get('[role="button"][aria-label="Exit Full Screen"]')
          .should('be.visible')
          .closest('.leaflet-container')
          .should($map => {
            expect($map[0].getBoundingClientRect().height).to.be.greaterThan(
              240
            );
          });
        cy.get('[role="button"][aria-label="Exit Full Screen"]').click();
        cy.get('[data-testid="organization-map"] .leaflet-container').should(
          $map => {
            expect($map[0].getBoundingClientRect().height).to.equal(240);
          }
        );
      }
    });
  });

  ['CAVE_RESCUE', 'ALL'].forEach(type => {
    it(`initializes organization search from the URL type ${type}`, () => {
      cy.intercept(
        { method: 'POST', pathname: '/api/v1/advanced-search' },
        {
          body: {
            results: [],
            totalResults: 0,
            totalEntities: 0,
            page: 1
          }
        }
      ).as('searchOrganizations');
      visit(`/organizations?type=${type}`);
      cy.wait('@searchOrganizations')
        .its('request.body.filter')
        .should(filter => {
          if (type === 'ALL') expect(filter).not.to.have.property('type');
          else expect(filter).to.have.property('type', type);
        });
      cy.get('[data-testid="entity-type-filter"]')
        .contains('[role="button"]', type === 'ALL' ? 'All' : 'Cave rescue')
        .should('have.attr', 'aria-pressed', 'true');
    });
  });

  it('defaults search to caving groups and sends or clears the explicit API type filter', () => {
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/advanced-search' },
      req => {
        req.reply({
          body: {
            results: [
              { ...organization('EDITION'), id: '42', _type: 'organizations' }
            ],
            totalResults: 1,
            totalEntities: 1,
            page: 1
          }
        });
      }
    ).as('searchOrganizations');
    visit('/organizations');
    cy.wait('@searchOrganizations')
      .its('request.body.filter.type')
      .should('eq', 'SPELEOLOGY');
    cy.get('[data-testid="entity-type-filter"]')
      .find('img')
      .should('not.exist');
    cy.get('[data-testid="entity-type-filter"]')
      .contains('[role="button"]', 'Caving group')
      .should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-testid="entity-type-filter"]')
      .contains('[role="button"]', 'Publisher')
      .click();
    cy.wait('@searchOrganizations')
      .its('request.body.filter.type')
      .should('eq', 'EDITION');
    cy.get('[data-testid="entity-type-filter"]')
      .contains('[role="button"]', 'All')
      .click();
    cy.wait('@searchOrganizations')
      .its('request.body.filter')
      .should('not.have.property', 'type');
    cy.contains('td', 'Example organization').find('img').should('not.exist');
    cy.contains('td', 'Publisher').find('img').should('have.length', 1);
    cy.screenshot('organization-search-types', { capture: 'viewport' });
    cy.viewport(390, 844);
    cy.get('[data-testid="entity-type-filter"]')
      .contains('[role="button"]', 'Library / documentation centre')
      .should('be.visible');
    cy.get('button[aria-label="Card view"]').click();
    cy.contains('a', 'Example organization')
      .find('img')
      .should('have.length', 1);
    cy.screenshot('organization-search-types-mobile', { capture: 'viewport' });
  });

  it('shares the yellow and white between organization clusters and detailed markers', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/**' },
      { body: [] }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/organizationsCoordinates' },
      {
        body: [
          [6, 45],
          [6.001, 45.001]
        ]
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/organizations' },
      {
        body: [
          {
            id: 42,
            name: 'Club',
            address: '1 Club street',
            type: 'SPELEOLOGY',
            latitude: 45,
            longitude: 6
          },
          {
            id: 43,
            name: 'Rescue',
            type: 'CAVE_RESCUE',
            latitude: 45.001,
            longitude: 6.001
          }
        ]
      }
    );
    visit('/map/45,6,8');
    cy.get('[data-testid="organization-cluster"]', { timeout: 15000 })
      .should('have.length', 1)
      .and('have.attr', 'data-count', '2')
      .and('have.css', 'background-color', 'rgb(209, 154, 0)')
      .and('have.css', 'color', 'rgb(255, 255, 255)')
      .and('have.css', 'border-color', 'rgb(255, 255, 255)');
    cy.screenshot('organization-map-cluster-color', { capture: 'viewport' });
    cy.get('[data-testid="organization-cluster"]').click();
    cy.get('[data-organization-type="SPELEOLOGY"] image', {
      timeout: 15000
    }).should('have.attr', 'href');
    cy.get('[data-organization-type="CAVE_RESCUE"] image').should(
      'have.attr',
      'href'
    );
    ['SPELEOLOGY', 'CAVE_RESCUE'].forEach(type => {
      cy.get(`[data-organization-type="${type}"] > path`)
        .should('have.attr', 'fill', '#d19a00')
        .and('have.attr', 'stroke', '#fff');
    });
    cy.get('[data-organization-type="SPELEOLOGY"]').click();
    cy.get('.leaflet-popup-content').within(() => {
      cy.get('.map-popup-title').should('have.text', 'CLUB');
      cy.get('.map-popup-title').parent().find('img').should('not.exist');
      cy.contains('.map-popup-property', 'Caving group')
        .find('img')
        .should('have.length', 1);
      cy.contains('.map-popup-property', '1 Club street').should('be.visible');
    });
    cy.screenshot('organization-map-pictograms', { capture: 'viewport' });
  });
});
