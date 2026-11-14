import { createAvatarFile } from '../../src/utils/avatarImage';

const imagePath = 'cypress/fixtures/entrance-map-tile.png';
const visit = (path = '/account', locale = 'en') => {
  cy.loginAs();
  cy.visit(path, {
    onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', locale)
  });
};
const editProfile = () => cy.get('[data-testid="public-profile-edit"]').click();
const selectPhoto = () => {
  cy.get('[data-testid="avatar-select"]').should('be.enabled');
  cy.get('[data-testid="avatar-file"]').selectFile(imagePath, { force: true });
  cy.get('[data-testid="avatar-save"]', { timeout: 20000 }).should(
    'be.visible'
  );
};
const savePhoto = () =>
  cy.get('[data-testid="avatar-save"]').should('be.enabled').click();
const setMessage = value => {
  cy.get('textarea[name="customMessage"]').clear();
  cy.get('textarea[name="customMessage"]').type(value, {
    parseSpecialCharSequences: false
  });
};

describe('Profile personalization', () => {
  let account;
  let organization;
  beforeEach(() => {
    account = {
      id: 1,
      nickname: 'Alex Martin',
      name: 'Alex',
      surname: 'Martin',
      mail: 'alex@example.org',
      language: 'eng',
      customMessage: 'Caving in the Jura.',
      avatarUrl: null
    };
    organization = {
      id: 42,
      name: 'Jura Caving Club',
      nameId: 1,
      type: 'SPELEOLOGY',
      country: 'FR',
      language: 'eng',
      customMessage: 'Club description',
      avatarUrl: null,
      cavers: [],
      exploredEntrances: [],
      exploredNetworks: [],
      authoredDocuments: [],
      publishedDocuments: [],
      authoredCount: 0,
      publishedCount: 0
    };
    cy.viewport(1280, 900);
    cy.mockApiCatchAll();
    cy.intercept('GET', '**/api/v1/account', req => req.reply(account)).as(
      'account'
    );
    cy.intercept('GET', '**/api/v1/cavers/1', req =>
      req.reply({
        ...account,
        type: 'CAVER',
        organizations: [],
        exploredEntrances: [],
        documents: []
      })
    );
    cy.intercept('GET', '**/api/v1/organizations/42', req =>
      req.reply(organization)
    ).as('organization');
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      {
        body: { languages: [{ id: 'eng', part1: 'en', refName: 'English' }] }
      }
    );
    cy.intercept('GET', '**/__profile-photo.png*', {
      fixture: 'entrance-map-tile.png'
    });
    cy.intercept('PATCH', '**/api/v1/account', req => {
      if (Object.hasOwn(req.body, 'customMessage')) req.alias = 'saveProfile';
      account = { ...account, ...req.body };
      req.reply(account);
    }).as('saveAccount');
    cy.intercept('PUT', '**/api/v1/account/avatar', req => {
      expect(req.headers['content-type']).to.include(
        'multipart/form-data; boundary='
      );
      account.avatarUrl = `/__profile-photo.png?v=${Date.now()}`;
      req.reply({ avatarUrl: account.avatarUrl });
    }).as('uploadPhoto');
    cy.intercept('DELETE', '**/api/v1/account/avatar', req => {
      account.avatarUrl = null;
      req.reply({ statusCode: 204 });
    }).as('removePhoto');
    cy.intercept('PUT', '**/api/v1/organizations/42/avatar', req => {
      organization.avatarUrl = `/__profile-photo.png?v=${Date.now()}`;
      req.reply({ avatarUrl: organization.avatarUrl });
    }).as('uploadLogo');
    cy.intercept('DELETE', '**/api/v1/organizations/42/avatar', req => {
      organization.avatarUrl = null;
      req.reply({ statusCode: 204 });
    }).as('removeLogo');
  });

  it('saves, displays as plain text, and clears the public message', () => {
    visit();
    cy.get('[data-testid="account-profile-id"]').should('have.text', 'Id: 1');
    editProfile();
    setMessage('<b>Hello</b>\nCave diver.');
    cy.get('[data-testid="public-profile-form"]')
      .contains('button', 'Save')
      .click();
    cy.wait('@saveProfile')
      .its('request.body.customMessage')
      .should('eq', '<b>Hello</b>\nCave diver.');
    visit('/persons/1');
    cy.contains('<b>Hello</b>').should('be.visible');
    cy.contains('Cave diver.').find('b').should('not.exist');
    visit();
    editProfile();
    cy.get('[data-testid="account-custom-message"] textarea').first().clear();
    cy.get('[data-testid="public-profile-form"]')
      .contains('button', 'Save')
      .click();
    cy.wait('@saveProfile').its('request.body.customMessage').should('eq', '');
    visit('/persons/1');
    cy.contains('h2', 'About me').should('not.exist');
  });

  it('preserves public-profile, email and preferences drafts through photo upload, replacement and removal', () => {
    visit();
    cy.get('[data-testid="user-avatar"]')
      .should('have.length', 2)
      .then($avatars => {
        $avatars.toArray().forEach(avatar => {
          const style =
            avatar.ownerDocument.defaultView.getComputedStyle(avatar);
          expect(
            parseFloat(style.fontSize) / parseFloat(style.width)
          ).to.be.closeTo(15 / 32, 0.001);
          expect(style.color).to.eq('rgb(255, 255, 255)');
        });
      });
    editProfile();
    cy.get('[data-testid="email-security-edit"]').click();
    cy.get('input[name="email"]').clear();
    cy.get('input[name="email"]').type('draft@example.org');
    cy.get('[data-testid="preferences-edit"]').click();
    cy.contains('label', 'Alert for news').find('input').check();
    setMessage('Unsaved introduction');
    selectPhoto();
    cy.get('[data-testid="cropper"]').focus();
    cy.get('[data-testid="cropper"]').trigger('keydown', { key: 'ArrowRight' });
    cy.get('[data-testid="cropper"]').trigger('keyup', { key: 'ArrowRight' });
    cy.get('input[aria-labelledby="avatar-zoom-label"]').focus();
    cy.get('input[aria-labelledby="avatar-zoom-label"]').trigger('keydown', {
      key: 'ArrowRight',
      keyCode: 39,
      // The thumb overlays the focused native input; keyboard events still target it.
      force: true
    });
    cy.screenshot('profile-photo-crop-desktop', { capture: 'viewport' });
    savePhoto();
    cy.wait('@uploadPhoto');
    cy.get('header [data-testid="user-avatar"] img')
      .should('have.attr', 'src')
      .and('include', '/__profile-photo.png');
    cy.get('[data-testid="account-custom-message"] textarea')
      .first()
      .should('have.value', 'Unsaved introduction');
    cy.get('input[name="email"]').should('have.value', 'draft@example.org');
    cy.contains('label', 'Alert for news').find('input').should('be.checked');
    cy.contains('Image saved.').should('be.visible');
    selectPhoto();
    savePhoto();
    cy.wait('@uploadPhoto');
    cy.get('[data-testid="avatar-remove"]').click();
    cy.get('[data-testid="avatar-confirm-remove"]').click();
    cy.wait('@removePhoto');
    cy.get('[data-testid="account-custom-message"] textarea')
      .first()
      .should('have.value', 'Unsaved introduction');
    cy.get('[data-testid="avatar-editor"] img').should('not.exist');
    cy.get('header [data-testid="user-avatar"] img').should('not.exist');
  });

  it('keeps the crop and text after a failed upload and allows retrying', () => {
    let attempts = 0;
    cy.intercept('PUT', '**/api/v1/account/avatar', req => {
      attempts += 1;
      if (attempts === 1) req.reply({ statusCode: 503 });
      else {
        account.avatarUrl = '/__profile-photo.png';
        req.reply({ avatarUrl: account.avatarUrl });
      }
    }).as('retryUpload');
    visit();
    editProfile();
    setMessage('Keep this draft');
    selectPhoto();
    savePhoto();
    cy.wait('@retryUpload');
    cy.get('[role="dialog"]').should(
      'contain.text',
      'The image could not be saved. Please try again.'
    );
    savePhoto();
    cy.wait('@retryUpload');
    cy.get('[role="dialog"]').should('not.exist');
    cy.get('[data-testid="account-custom-message"] textarea')
      .first()
      .should('have.value', 'Keep this draft');
    cy.reload();
    cy.get('img[alt="Alex Martin"]').should(
      'have.attr',
      'src',
      '/__profile-photo.png'
    );
    visit('/persons/1');
    cy.get('img[alt="Alex Martin"]').should('be.visible');
  });

  it('rejects unsupported, oversized and unreadable files without uploading', () => {
    visit();
    editProfile();
    cy.get('[data-testid="avatar-file"]').selectFile(
      {
        contents: Cypress.Buffer.from('<svg/>'),
        fileName: 'logo.svg',
        mimeType: 'image/svg+xml'
      },
      { force: true }
    );
    cy.contains('Choose a JPEG, PNG, WebP or GIF image.').should('be.visible');
    cy.get('[data-testid="avatar-file"]').selectFile(
      {
        contents: Cypress.Buffer.alloc(5 * 1024 * 1024 + 1),
        fileName: 'large.png',
        mimeType: 'image/png'
      },
      { force: true }
    );
    cy.contains('The image must not exceed 5 MB.').should('be.visible');
    cy.get('[data-testid="avatar-file"]').selectFile(
      {
        contents: Cypress.Buffer.from('not an image'),
        fileName: 'broken.png',
        mimeType: 'image/png'
      },
      { force: true }
    );
    cy.contains('This image could not be read. Choose another image.').should(
      'be.visible'
    );
    cy.get('@uploadPhoto.all').should('have.length', 0);
  });

  it('retains the message on server errors and validates oversized values before submission', () => {
    account.customMessage = 'x'.repeat(501);
    visit();
    editProfile();
    cy.get('[data-testid="public-profile-form"]')
      .contains('button', 'Save')
      .click();
    cy.get('[data-testid="account-custom-message"] textarea')
      .first()
      .should('be.focused');
    cy.get('@saveAccount.all').should(requests => {
      expect(
        requests.filter(request =>
          Object.hasOwn(request.request.body, 'customMessage')
        )
      ).to.have.length(0);
    });
    cy.intercept('PATCH', '**/api/v1/account', {
      statusCode: 400,
      body: {}
    }).as('failedMessage');
    setMessage('Keep after error');
    cy.get('[data-testid="public-profile-form"]')
      .contains('button', 'Save')
      .click();
    cy.wait('@failedMessage');
    cy.get('[data-testid="account-custom-message"] textarea')
      .first()
      .should('have.value', 'Keep after error');
    cy.get('[data-testid="public-profile-form"] [role="alert"]').should(
      'be.visible'
    );
  });

  it('supports the whole-logo option and preserves organization form changes', () => {
    visit('/organizations/42/edit');
    cy.get('[data-testid="organization-name"] input').clear();
    cy.get('[data-testid="organization-name"] input').type('Unsaved club name');
    selectPhoto();
    cy.contains('Show entire logo').should('be.visible');
    cy.get('[role="switch"]').should('be.checked');
    cy.screenshot('organization-logo-desktop', { capture: 'viewport' });
    savePhoto();
    cy.wait('@uploadLogo');
    cy.get('[data-testid="organization-name"] input').should(
      'have.value',
      'Unsaved club name'
    );
    cy.get('textarea[name="organization.customMessage"]')
      .first()
      .should('have.value', 'Club description');
    cy.get('[data-testid="avatar-remove"]').click();
    cy.get('[data-testid="avatar-confirm-remove"]').click();
    cy.wait('@removeLogo');
    cy.get('[data-testid="organization-name"] input').should(
      'have.value',
      'Unsaved club name'
    );
    selectPhoto();
    cy.get('[role="switch"]').uncheck();
    cy.get('[data-testid="cropper"]').should('exist');
    savePhoto();
    cy.wait('@uploadLogo');
    visit('/organizations/42');
    cy.get(
      '[data-testid="organization-logo"] img[alt="Jura Caving Club"]'
    ).should('be.visible');
    cy.get('[data-testid="organization-logo"]').should($logo =>
      expect($logo.width()).to.eq(128)
    );
    cy.get('h1 img[alt="Jura Caving Club"]').should('not.exist');
    cy.screenshot('organization-logo-public-desktop', { capture: 'viewport' });
    cy.reload();
    cy.get(
      '[data-testid="organization-logo"] img[alt="Jura Caving Club"]'
    ).should('be.visible');
    cy.viewport(390, 844);
    cy.get('[data-testid="organization-logo"] img').should('be.visible');
    cy.screenshot('organization-logo-public-mobile', { capture: 'viewport' });
    cy.document().then(doc =>
      expect(doc.documentElement.scrollWidth).to.be.at.most(390)
    );
  });

  it('uses a large stable crop frame and lets a wide logo fit at minimum zoom', () => {
    visit('/organizations/42/edit');
    cy.get('[data-testid="avatar-file"]').should('exist');
    cy.document()
      .then(doc => {
        const canvas = doc.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 250;
        const context = canvas.getContext('2d');
        context.fillStyle = '#f57c00';
        context.fillRect(0, 0, 1000, 250);
        return new Cypress.Promise(resolve =>
          canvas.toBlob(resolve, 'image/png')
        );
      })
      .then(blob => blob.arrayBuffer())
      .then(contents => {
        cy.get('[data-testid="avatar-file"]').selectFile(
          {
            contents: Cypress.Buffer.from(contents),
            fileName: 'wide-logo.png',
            mimeType: 'image/png'
          },
          { force: true }
        );
      });
    cy.get('[data-testid="avatar-save"]', { timeout: 20000 }).should(
      'be.visible'
    );
    cy.get('[role="switch"]').uncheck();
    cy.get('[data-testid="cropper"]').should($crop => {
      const area = $crop[0].closest('[data-testid="avatar-crop-area"]');
      expect(
        $crop[0].getBoundingClientRect().width /
          area.getBoundingClientRect().width
      ).to.be.closeTo(0.9, 0.01);
    });
    cy.get('input[aria-labelledby="avatar-zoom-label"]')
      .should('have.attr', 'min', '0.5')
      .focus();
    cy.get('input[aria-labelledby="avatar-zoom-label"]').trigger('keydown', {
      key: 'Home',
      keyCode: 36,
      force: true
    });
    cy.get('input[aria-labelledby="avatar-zoom-label"]').should(
      'have.value',
      '0.5'
    );
    cy.get('[data-testid="avatar-crop-area"]').should($area => {
      const image = $area.find('img')[0].getBoundingClientRect();
      const frame = $area
        .find('[data-testid="cropper"]')[0]
        .getBoundingClientRect();
      expect(image.width).to.be.at.most(frame.width);
      expect(image.height).to.be.at.most(frame.height);
    });
    cy.screenshot('organization-wide-logo-crop', { capture: 'viewport' });
    savePhoto();
    cy.wait('@uploadLogo');
  });

  it('provides a fullscreen editor on mobile and blocks offline writes', () => {
    cy.viewport(390, 844);
    visit();
    editProfile();
    cy.screenshot('profile-public-mobile', { capture: 'viewport' });
    selectPhoto();
    cy.get('[data-testid="avatar-save"]')
      .closest('[role="dialog"]')
      .should($dialog => {
        expect($dialog[0].getBoundingClientRect().width).to.eq(390);
      });
    cy.screenshot('profile-photo-crop-mobile', { capture: 'viewport' });
    cy.window().then(win => win.dispatchEvent(new win.Event('offline')));
    cy.get('[data-testid="avatar-save"]').should('be.disabled');
    cy.get('[data-testid="avatar-save"]')
      .closest('[role="dialog"]')
      .find('button[aria-label="close"]')
      .click();
    cy.get('[data-testid="avatar-select"]').should('be.disabled');
    cy.get('[data-testid="public-profile-form"]')
      .contains('button', 'Save')
      .should('be.disabled');
    cy.window().then(win => win.dispatchEvent(new win.Event('online')));
    cy.get('[data-testid="avatar-select"]').should('be.enabled');
    cy.document().then(doc =>
      expect(doc.documentElement.scrollWidth).to.be.at.most(390)
    );
  });

  it('renders the profile in French without overflowing', () => {
    account.customMessage = '';
    // The saved account language takes precedence over localStorage after login.
    account.language = 'fra';
    cy.viewport(390, 844);
    visit('/account', 'fr');
    cy.contains('h2', 'Profil public').should('be.visible');
    cy.get('[data-testid="account-profile-id"]').should('have.text', 'Id : 1');
    cy.get('[data-testid="account-profile-id"]')
      .should('have.css', 'color')
      .then(color => {
        cy.contains('p', /^Prénom$/).should('have.css', 'color', color);
      });
    cy.screenshot('profile-id-french-mobile', { capture: 'viewport' });
    cy.contains('Ajoutez quelques mots pour vous présenter.').should(
      'have.css',
      'color',
      'rgb(117, 117, 117)'
    );
    cy.get('[data-testid="public-profile-edit"]')
      .should('contain.text', 'Modifier')
      .click();
    cy.contains('Ajouter une image').should('be.visible');
    cy.get('[data-testid="public-profile-form"]')
      .contains('button', 'Enregistrer')
      .should('be.visible');
    cy.contains('À propos de moi').should('exist');
    cy.screenshot('profile-public-french-mobile', { capture: 'viewport' });
    cy.document().then(doc =>
      expect(doc.documentElement.scrollWidth).to.be.at.most(390)
    );
  });

  it('integrates the avatar in the profile content for the owner and other visitors', () => {
    account.avatarUrl = '/__profile-photo.png';
    visit('/persons/1');
    cy.get('[data-testid="caver-profile"] img[alt="Alex Martin"]').should(
      'be.visible'
    );
    cy.get('h1 img[alt="Alex Martin"]').should('not.exist');
    cy.get('[data-testid="caver-profile"]').should(
      'contain.text',
      'Caving in the Jura.'
    );
    cy.screenshot('public-profile-desktop', { capture: 'viewport' });
    cy.loginAs({ id: 2, nickname: 'Another caver' });
    const longNickname = 'Alexandria'.repeat(6);
    cy.then(() => {
      account.nickname = longNickname;
      account.customMessage = 'a'.repeat(500);
    });
    cy.viewport(390, 844);
    cy.visit('/persons/1');
    cy.get('[data-testid="caver-profile"] img').should('be.visible');
    cy.get('[data-testid="caver-profile"]').should(
      'contain.text',
      longNickname
    );
    cy.screenshot('public-profile-mobile-long-content', {
      capture: 'viewport'
    });
    cy.document().then(doc =>
      expect(doc.documentElement.scrollWidth).to.be.at.most(390)
    );
    cy.intercept('GET', '**/api/v1/cavers/1', {
      body: { ...account, type: 'AUTHOR' }
    });
    cy.reload();
    cy.get('[data-testid="caver-profile"]').should('not.exist');
    cy.get('[data-testid="avatar-select"]').should('not.exist');
  });

  it('hides avatar controls for deleted organizations and anonymous profile visitors', () => {
    organization.isDeleted = true;
    visit('/organizations/42/edit');
    cy.get('[data-testid="organization-name"] input').should('exist');
    cy.get('[data-testid="avatar-editor"]').should('not.exist');
    cy.clearLocalStorage('grottocenter_token');
    cy.visit('/persons/1');
    cy.get('[data-testid="caver-profile"]').should('be.visible');
    cy.get('[data-testid="avatar-select"]').should('not.exist');
  });

  it('exports the chosen pixels and fits an entire rectangular logo into a square', () => {
    cy.document().then(async doc => {
      const source = doc.createElement('canvas');
      source.width = 800;
      source.height = 400;
      const ctx = source.getContext('2d');
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 400, 400);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(400, 0, 400, 400);
      const url = source.toDataURL();
      const crop = await createAvatarFile(
        url,
        { x: 400, y: 0, width: 400, height: 400 },
        false
      );
      const logo = await createAvatarFile(url, null, true);
      const cropped = await createImageBitmap(crop);
      const contained = await createImageBitmap(logo);
      expect(cropped.width).to.eq(400);
      expect(cropped.height).to.eq(400);
      const output = doc.createElement('canvas');
      output.width = 512;
      output.height = 512;
      const result = output.getContext('2d');
      result.drawImage(cropped, 0, 0);
      expect(Array.from(result.getImageData(200, 200, 1, 1).data)).to.deep.eq([
        0, 255, 0, 255
      ]);
      result.clearRect(0, 0, 512, 512);
      result.drawImage(contained, 0, 0);
      expect(contained.width).to.eq(512);
      expect(contained.height).to.eq(512);
      expect(result.getImageData(256, 10, 1, 1).data[3]).to.eq(0);
      expect(Array.from(result.getImageData(10, 256, 1, 1).data)).to.deep.eq([
        255, 0, 0, 255
      ]);
      expect(Array.from(result.getImageData(500, 256, 1, 1).data)).to.deep.eq([
        0, 255, 0, 255
      ]);
      cropped.close();
      contained.close();
    });
  });
});
