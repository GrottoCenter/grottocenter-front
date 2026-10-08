const current = {
  id: 7,
  title: 'Original document',
  description: 'Original description',
  type: 'Event',
  dateInscription: '2026-01-01T00:00:00Z',
  datePublication: '2026-01-01',
  isValidated: false,
  validator: { id: 9, nickname: 'Moderator' },
  authors: [{ id: 1, nickname: 'Alice' }],
  authorsOrganization: [],
  files: [],
  massifs: [],
  entrances: [],
  mainLanguage: 'eng'
};

const other = { ...current, id: 8, title: 'Other document' };
const proposal = {
  id: 7,
  title: 'Proposed document',
  description: `Proposed description\n${'A very long description. '.repeat(100)}${'x'.repeat(200)}`,
  type: 'Event',
  datePublication: '2026-01-01',
  authors: [{ id: 2, nickname: 'Bob' }],
  authorsOrganization: [],
  files: [],
  mainLanguage: 'eng'
};

const openPreview = () => {
  cy.contains('tr', 'Original document', { timeout: 30000 }).click();
  cy.get('[data-testid="document-moderation-title"]').should('be.visible');
  cy.get('[data-testid="preview-validate"]').should('be.enabled');
};

describe('Document moderation preview', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    // Production previews register a service worker. Keep each mocked scenario
    // independent of response caches and of cached HTML's locale bootstrap.
    cy.then(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    });
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/sw.js' },
      { statusCode: 404, body: '' }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/account' },
      { body: { id: 1, nickname: 'TestCaver', language: 'eng' } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/licenses' },
      { body: { licenses: [] } }
    );
    let isProcessed = false;
    let proposed = { ...proposal };
    cy.intercept({ method: 'GET', pathname: '/api/v1/documents' }, request => {
      request.reply({
        body: { documents: isProcessed ? [other] : [current, other] },
        headers: { 'Content-Range': `documents 0-1/${isProcessed ? 1 : 2}` }
      });
    }).as('documents');
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/7' },
      request => {
        request.reply(
          request.query.requireUpdate === 'true' ? proposed : current
        );
      }
    ).as('document');
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/7/children' },
      { body: { documents: [] } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      {
        body: { languages: [{ id: 'eng', part1: 'en', refName: 'English' }] }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/types' },
      {
        body: { documentTypes: [{ id: 17, name: 'Event' }] }
      }
    );
    cy.intercept(
      { method: 'PUT', pathname: '/api/v1/documents/validate' },
      request => {
        isProcessed = true;
        request.reply({ statusCode: 200, body: {} });
      }
    ).as('process');
    cy.intercept(
      { method: 'PUT', pathname: '/api/v1/documents/7' },
      request => {
        proposed = { ...proposed, title: 'Corrected document' };
        request.reply({ statusCode: 200, body: current });
      }
    ).as('save');
    cy.loginAs({ groups: ['User', 'Moderator'] });
    cy.visit('/documents/validation', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.wait('@documents');
  });

  it('keeps organization names in the proposed detail, author diff and edit chips', () => {
    const organizations = [{ id: 3714, name: 'Known organization' }];
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/7' },
      request => {
        request.reply(
          request.query.requireUpdate === 'true'
            ? {
                ...proposal,
                authorsOrganization: [
                  { id: 3714, name: null },
                  { id: 4000, name: 'New organization' }
                ],
                editor: { id: 3715, name: null },
                library: { id: 3716, name: null }
              }
            : {
                ...current,
                authorsOrganization: organizations,
                editor: { id: 3715, name: 'Known editor' },
                library: { id: 3716, name: 'Known library' }
              }
        );
      }
    );
    openPreview();
    cy.get('[data-testid="document-moderation-result"]')
      .should('contain.text', 'Known organization')
      .and('contain.text', 'Known editor')
      .and('contain.text', 'Known library');
    cy.get('[data-testid="document-diff-authorsOrganization"]')
      .should('contain.text', 'Known organization')
      .and('contain.text', 'New organization');
    cy.get('[data-testid="preview-edit"]').click();
    cy.contains('[role="dialog"]', 'Edit document').within(() => {
      cy.contains('Known organization').scrollIntoView();
      cy.contains('Known organization').should('be.visible');
      cy.contains('New organization').scrollIntoView();
      cy.contains('New organization').should('be.visible');
    });
  });

  it('shows changes to subjects, geographic coverage, additional languages and comments', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/7' },
      request => {
        request.reply(
          request.query.requireUpdate === 'true'
            ? {
                ...proposal,
                subjects: [{ id: '2', subject: 'Geology' }],
                iso3166: [{ iso: 'ES', name: 'España' }],
                languages: ['eng', 'spa'],
                creatorComment: 'Updated comment'
              }
            : {
                ...current,
                subjects: [{ id: '1', subject: 'General' }],
                iso3166: [{ iso: 'FR', name: 'France' }],
                languages: ['eng', 'fra'],
                creatorComment: 'Original comment'
              }
        );
      }
    );
    openPreview();
    cy.get('[data-testid="document-diff-subjects"]')
      .should('contain.text', 'General')
      .and('contain.text', 'Geology');
    cy.get('[data-testid="document-diff-iso3166"]')
      .should('contain.text', 'France')
      .and('contain.text', 'España');
    cy.get('[data-testid="document-diff-iso3166"]')
      .find('del')
      .should('contain.text', 'FR');
    cy.get('[data-testid="document-diff-iso3166"]')
      .find('ins')
      .should('contain.text', 'ES');
    cy.get('[data-testid="document-diff-languages"]')
      .should('contain.text', 'fra')
      .and('contain.text', 'spa');
    cy.get('[data-testid="document-diff-creatorComment"]')
      .should('contain.text', 'Original')
      .and('contain.text', 'Updated');
  });

  [
    [320, 640],
    [320, 640, 'fr'],
    [360, 780, 'fr'],
    [390, 844],
    [768, 1024],
    [900, 900, 'fr'],
    [1280, 900],
    [844, 390]
  ].forEach(([width, height, locale = 'en']) => {
    it(`keeps the proposal, long diff and actions usable at ${width} × ${height} (${locale})`, () => {
      if (locale === 'fr') {
        cy.intercept(
          { method: 'GET', pathname: '/api/v1/account' },
          { body: { id: 1, nickname: 'TestCaver', language: 'fra' } }
        );
        cy.visit('/documents/validation', {
          onBeforeLoad: win =>
            win.localStorage.setItem('selectedLanguage', locale)
        });
        cy.wait('@documents');
      }
      openPreview();
      cy.viewport(width, height);
      cy.get('[data-testid="document-moderation-title"]').should(
        'contain.text',
        locale === 'fr' ? 'Examiner une modification' : 'Review a modification'
      );
      cy.get('[data-testid="document-diff-title"]')
        .find('del')
        .should('contain.text', 'Original');
      cy.get('[data-testid="document-diff-title"]')
        .find('ins')
        .should('contain.text', 'Proposed');
      cy.get('[data-testid="document-moderation-result"]')
        .should(
          'contain.text',
          locale === 'fr'
            ? 'Document après validation'
            : 'Document after validation'
        )
        .and('contain.text', 'Proposed document');
      cy.get('[data-testid="document-moderation-preview"]').should(
        'not.contain.text',
        locale === 'fr'
          ? 'Un modérateur doit valider la dernière modification'
          : 'A moderator needs to validate the last modification'
      );
      cy.get('[data-testid="preview-decline"]').should(
        'contain.text',
        locale === 'fr' ? 'Refuser' : 'Decline'
      );
      cy.get('[data-testid="document-diff-authors"]')
        .should('contain.text', 'Alice')
        .and('contain.text', 'Bob');
      cy.get('[data-testid="document-moderation-preview"]').should($preview => {
        const dialog = $preview[0].closest('[role="dialog"]');
        const bounds = dialog.getBoundingClientRect();
        expect(bounds.left).to.be.at.least(0);
        expect(bounds.right).to.be.at.most(width + 1);
        expect(dialog.scrollWidth).to.be.at.most(dialog.clientWidth + 1);
        const content = $preview[0].parentElement.getBoundingClientRect();
        const actions = dialog
          .querySelector('[data-testid="document-moderation-actions"]')
          .getBoundingClientRect();
        if (width >= 900) expect(actions.bottom).to.be.at.most(content.top + 1);
        else expect(actions.top).to.be.at.least(content.bottom - 1);
        const changesHeading = dialog.querySelector(
          '[data-testid="document-diff"] h2'
        );
        const resultHeading = dialog.querySelector(
          '[data-testid="document-moderation-result"] h2'
        );
        expect(getComputedStyle(changesHeading).fontSize).to.equal(
          getComputedStyle(resultHeading).fontSize
        );
        const changesCard = changesHeading.parentElement;
        const resultCard = resultHeading.parentElement;
        if (width >= 900) {
          const title = dialog
            .querySelector('[data-testid="document-moderation-title"]')
            .getBoundingClientRect();
          const lastButton = dialog
            .querySelector('[data-testid="preview-decline"]')
            .getBoundingClientRect();
          expect(title.left).to.be.closeTo(
            resultCard.getBoundingClientRect().left,
            1
          );
          expect(lastButton.right).to.be.closeTo(
            resultCard.getBoundingClientRect().right,
            1
          );
          if (title.height <= lastButton.height) {
            expect(title.top + title.height / 2).to.be.closeTo(
              lastButton.top + lastButton.height / 2,
              1
            );
          }
        }
        ['boxShadow', 'borderRadius', 'paddingTop', 'paddingLeft'].forEach(
          property => {
            expect(getComputedStyle(resultCard)[property]).to.equal(
              getComputedStyle(changesCard)[property]
            );
          }
        );
        expect(
          dialog.querySelector('[data-testid="document-moderation-result"] h1')
        ).to.equal(null);
        if (width < 600) {
          expect(bounds.width).to.be.closeTo(width, 1);
          expect(bounds.height).to.be.closeTo(height, 1);
        }
      });
      if (width === 390)
        cy.screenshot('document-moderation-mobile', { capture: 'viewport' });
      ['validate', 'edit', 'decline'].forEach(action => {
        cy.get(`[data-testid="preview-${action}"]`)
          .should('be.visible')
          .and('be.enabled')
          .should($button => {
            const bounds = $button[0].getBoundingClientRect();
            expect(bounds.width).to.be.at.least(44);
            expect(bounds.height).to.be.at.least(44);
            expect(bounds.left).to.be.at.least(0);
            expect(bounds.right).to.be.at.most(width + 1);
            expect(bounds.bottom).to.be.at.most(height + 1);
            expect($button[0].scrollWidth).to.be.at.most(
              $button[0].clientWidth + 1
            );
            expect($button.text().trim()).not.to.equal('');
            const icon = $button[0].querySelector('svg');
            const label = $button[0].lastElementChild;
            const iconBounds = icon.getBoundingClientRect();
            const labelBounds = label.getBoundingClientRect();
            expect(iconBounds.right).to.be.at.most(labelBounds.left + 1);
            expect(iconBounds.top + iconBounds.height / 2).to.be.closeTo(
              labelBounds.top + labelBounds.height / 2,
              1
            );
          });
      });
      cy.get('[data-testid="preview-validate"]').should($validate => {
        const validation = $validate[0].getBoundingClientRect();
        const dialog = $validate[0].closest('[role="dialog"]');
        const editing = dialog
          .querySelector('[data-testid="preview-edit"]')
          .getBoundingClientRect();
        const refusal = dialog
          .querySelector('[data-testid="preview-decline"]')
          .getBoundingClientRect();
        expect(validation.top).to.be.closeTo(editing.top, 1);
        expect(editing.top).to.be.closeTo(refusal.top, 1);
        if (width < 600) {
          expect(validation.width).to.be.closeTo(editing.width, 1);
          expect(editing.width).to.be.closeTo(refusal.width, 1);
          expect(validation.bottom).to.be.closeTo(editing.bottom, 1);
          expect(editing.bottom).to.be.closeTo(refusal.bottom, 1);
        }
      });
      cy.get('[data-testid="preview-validate"]').then($validate => {
        const topBeforeScrolling = $validate[0].getBoundingClientRect().top;
        cy.get('[data-testid="document-moderation-preview"]')
          .parent()
          .scrollTo('bottom');
        cy.get('[data-testid="preview-validate"]').should($button => {
          expect($button[0].getBoundingClientRect().top).to.be.closeTo(
            topBeforeScrolling,
            1
          );
        });
      });
      cy.get('[data-testid="preview-decline"]').click();
      cy.get('[data-testid="confirm-process-documents"]').should('be.disabled');
      cy.contains(
        '[role="dialog"]',
        locale === 'fr'
          ? 'Confirmation du refus du document'
          : 'Confirmation of document refusal'
      )
        .find('textarea')
        .first()
        .type('Wrong author');
      cy.get('[data-testid="confirm-process-documents"]').click();
      cy.wait('@process')
        .its('request.body.documents')
        .should('deep.equal', [
          { id: 7, isValidated: 'false', validationComment: 'Wrong author' }
        ]);
      cy.get('[data-testid="document-moderation-preview"]').should('not.exist');
    });
  });

  it('processes the displayed document independently of the batch selection', () => {
    cy.contains('tr', 'Other document').find('input[type="checkbox"]').check();
    openPreview();
    cy.get('[data-testid="preview-validate"]').click();
    cy.get('[data-testid="confirm-process-documents"]').click();
    cy.wait('@process')
      .its('request.body.documents')
      .should('deep.equal', [
        { id: 7, isValidated: 'true', validationComment: '' }
      ]);
    cy.get('[data-testid="document-moderation-preview"]').should('not.exist');
  });

  it('keeps batch validation available', () => {
    cy.contains('tr', 'Original document')
      .find('input[type="checkbox"]')
      .check();
    cy.contains('tr', 'Other document').find('input[type="checkbox"]').check();
    cy.get('[data-testid="batch-validate"]').click();
    cy.get('[data-testid="confirm-process-documents"]').click();
    cy.wait('@process').its('request.body.documents').should('have.length', 2);
  });

  it('keeps the refusal comment when actions move between the header and footer', () => {
    openPreview();
    cy.get('[data-testid="preview-decline"]').click();
    cy.contains('[role="dialog"]', 'Confirmation of document refusal')
      .find('textarea')
      .first()
      .type('Wrong author');
    cy.viewport(390, 844);
    cy.contains('[role="dialog"]', 'Confirmation of document refusal')
      .find('textarea')
      .first()
      .should('have.value', 'Wrong author');
    cy.viewport(1280, 900);
    cy.contains('[role="dialog"]', 'Confirmation of document refusal')
      .find('textarea')
      .first()
      .should('have.value', 'Wrong author');
    cy.get('[data-testid="confirm-process-documents"]').click();
    cy.wait('@process')
      .its('request.body.documents')
      .should('deep.equal', [
        { id: 7, isValidated: 'false', validationComment: 'Wrong author' }
      ]);
  });

  [false, true].forEach(isNewDocument => {
    it(`returns to the refreshed proposal after editing a ${isNewDocument ? 'new' : 'previously moderated'} document`, () => {
      if (isNewDocument) {
        const newDocument = { ...current, validator: null };
        let corrected = newDocument;
        cy.intercept(
          { method: 'GET', pathname: '/api/v1/documents/7' },
          request => {
            request.reply(
              request.query.requireUpdate === 'true' ? corrected : newDocument
            );
          }
        );
        cy.intercept(
          { method: 'PUT', pathname: '/api/v1/documents/7' },
          request => {
            corrected = {
              ...proposal,
              title: 'Corrected document',
              description: newDocument.description,
              authors: newDocument.authors
            };
            request.reply({ statusCode: 200, body: newDocument });
          }
        ).as('save');
      }
      const expectedTitle = isNewDocument
        ? 'Review a new document'
        : 'Review a modification';
      openPreview();
      cy.get('[data-testid="document-moderation-title"]').should(
        'contain.text',
        expectedTitle
      );
      if (isNewDocument)
        cy.get('[data-testid="document-diff"]').should('not.exist');
      cy.get('[data-testid="preview-edit"]').click();
      cy.contains('[role="dialog"]', 'Edit document')
        .find('input[name="Title"]')
        .should(
          'have.value',
          isNewDocument ? 'Original document' : 'Proposed document'
        )
        .as('documentTitle');
      cy.get('@documentTitle').clear();
      cy.get('@documentTitle').type('Corrected document');
      cy.contains('[role="dialog"]', 'Edit document')
        .find('button[type="submit"]')
        .first()
        .click();
      cy.wait('@save')
        .its('request.body')
        .should('include', 'Corrected document');
      cy.contains('[role="dialog"]', 'Edit document').should('not.exist');
      cy.get('[data-testid="document-moderation-title"]').should(
        'contain.text',
        expectedTitle
      );
      cy.get('[data-testid="document-moderation-result"]').should(
        'contain.text',
        'Corrected document'
      );
      if (isNewDocument) {
        cy.get('[data-testid="document-diff"]').should('not.exist');
      } else {
        cy.get('[data-testid="document-diff-title"]').should(
          'contain.text',
          'Corrected'
        );
      }
      cy.get('@process.all').should('have.length', 0);
    });
  });

  [390, 1280].forEach(width => {
    it(`explains the file restriction beside the actions at ${width}px`, () => {
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/documents/7' },
        request => {
          request.reply(
            request.query.requireUpdate === 'true'
              ? {
                  ...proposal,
                  description: 'Proposed description',
                  newFiles: [{ id: 9, fileName: 'Pending survey.png' }]
                }
              : current
          );
        }
      );
      openPreview();
      cy.viewport(width, 844);
      cy.get('[data-testid="pending-files-edit-notice"]').should('be.visible');
      cy.get('[data-testid="preview-edit"]').should('be.disabled');
      cy.get('[data-testid="preview-validate"]').should('be.enabled');
      cy.get('[data-testid="preview-decline"]').should('be.enabled');
      cy.get('[data-testid="document-preview-sections"]').should($sections => {
        Array.from($sections[0].children).forEach(section => {
          expect(getComputedStyle(section).boxShadow).to.equal('none');
        });
      });
      cy.get('[data-testid="document-moderation-actions"]').should($actions => {
        const note = $actions[0].querySelector(
          '[data-testid="pending-files-edit-notice"]'
        );
        expect(note).not.to.equal(null);
        expect(
          $actions[0]
            .querySelector('[data-testid="preview-edit"]')
            .getAttribute('aria-describedby')
        ).to.equal(note.id);
        const bounds = note.getBoundingClientRect();
        expect(bounds.bottom).to.be.at.most(844 + 1);
        expect(bounds.left).to.be.at.least(0);
        expect(bounds.right).to.be.at.most(width + 1);
      });
      cy.screenshot(`document-moderation-actions-${width}`, {
        capture: 'viewport'
      });
    });
  });
});
