import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import messages from '@/../public/lang/en.json';
import { DetailItem, DetailsList, FilesSection } from './Section';

// Section also owns all document previews. Mock the MUI icon barrel so this
// focused layout test does not make Vitest open the package's thousands of icon
// modules on Windows, where that can exceed the per-process file handle limit.
vi.mock('@mui/icons-material', () => {
  const MockIcon = () => null;
  return {
    Article: MockIcon,
    ChevronLeft: MockIcon,
    ChevronRight: MockIcon,
    Description: MockIcon,
    EventAvailable: MockIcon,
    Image: MockIcon,
    InsertDriveFile: MockIcon,
    PictureAsPdf: MockIcon,
    TableChart: MockIcon,
    ZoomIn: MockIcon,
    ZoomOut: MockIcon
  };
});

describe('GLB attachment thumbnails', () => {
  const source = 'https://models.example.org/scan.glb';
  const large = 'https://models.example.org/large.webp';
  const medium = 'https://models.example.org/medium.webp';
  const small = 'https://models.example.org/small.webp';

  it.each([
    ['large', { large, medium, small }, large],
    ['medium', { large: null, medium, small }, medium],
    ['small', { large: null, medium: null, small }, small],
    ['missing', null, null],
    ['empty', { large: null, medium: null, small: null }, null]
  ])(
    'uses the %s variant without loading the original as an image',
    (_name, thumbnails, expected) => {
      render(
        <IntlProvider locale="en" messages={messages}>
          <MemoryRouter>
            <FilesSection
              files={[
                {
                  fileName: 'scan.GLB',
                  completePath: source,
                  thumbnails
                }
              ]}
            />
          </MemoryRouter>
        </IntlProvider>
      );
      const poster = screen.queryByTestId('model-preview-poster');
      if (expected) {
        expect(poster).toHaveAttribute('src', expected);
      } else {
        expect(poster).not.toBeInTheDocument();
      }
      expect(screen.getByRole('link', { name: 'scan.GLB' })).toHaveAttribute(
        'href',
        source
      );
      expect(screen.queryByTestId('model-viewer')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View in 3D' })).toBeEnabled();
    }
  );
});

describe('DetailsList', () => {
  it('renders the reference and metadata as sibling sections', () => {
    render(
      <DetailsList
        title="Metadata"
        referenceTitle="Bibliographic reference"
        reference={<span>Formatted reference</span>}>
        <DetailItem label="Type" value="Article" />
      </DetailsList>
    );

    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings.map(heading => heading.textContent)).toEqual([
      'Bibliographic reference',
      'Metadata'
    ]);
    expect(headings[0]).not.toHaveClass('MuiTypography-colorSecondary');
    expect(headings[1]).not.toHaveClass('MuiTypography-colorSecondary');
    expect(headings[0].closest('section')).toHaveTextContent(
      'Formatted reference'
    );
    expect(headings[1].closest('section')).toHaveTextContent('TypeArticle');
  });
});
