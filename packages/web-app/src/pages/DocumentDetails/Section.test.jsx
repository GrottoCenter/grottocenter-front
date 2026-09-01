import { render, screen } from '@testing-library/react';

import { DetailItem, DetailsList } from './Section';

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
