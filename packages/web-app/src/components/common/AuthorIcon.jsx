import { useId } from 'react';
import { createSvgIcon } from '@mui/material/utils';

const PERSON_PATH =
  'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4';
const PEN_PATH =
  'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z';

const AuthorGlyph = () => {
  const cutoutId = useId();
  return (
    // Preserve author.svg's paths and proportions, fitted to the MUI 24px grid.
    <g transform="translate(-2.94 -2.94) scale(.29412)">
      <defs>
        <mask
          id={cutoutId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="100"
          height="100">
          <rect width="100" height="100" fill="#fff" />
          {/* Black cuts a transparent gap around the pen instead of a brown rim. */}
          <path
            d={PEN_PATH}
            transform="matrix(2.8 0 0 2.8 24 26)"
            fill="#000"
            stroke="#000"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </mask>
      </defs>
      <g mask={`url(#${cutoutId})`}>
        <path d={PERSON_PATH} transform="matrix(2.7 0 0 2.7 8 6)" />
      </g>
      <path d={PEN_PATH} transform="matrix(2.8 0 0 2.8 24 26)" />
    </g>
  );
};

export default createSvgIcon(<AuthorGlyph />, 'Author');
