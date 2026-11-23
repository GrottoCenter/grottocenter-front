import { readFileSync } from 'node:fs';
import { URL as NodeURL } from 'node:url';

import { readPhotoDate } from './photoDate';

const fixtureBytes = name =>
  readFileSync(
    new NodeURL(`../../cypress/fixtures/photo-dates/${name}`, import.meta.url)
  );

it.each(['capture.jpg', 'capture.png', 'capture.tiff'])(
  'reads the original capture day from %s without shifting it to UTC',
  async name => {
    const file = new File([fixtureBytes(name)], name);
    expect(await readPhotoDate(file)).toBe('2012-02-29');
  }
);

it('does not substitute the file modification time when capture metadata is missing', async () => {
  const file = new File([fixtureBytes('no-date.jpg')], 'no-date.jpg', {
    lastModified: new Date('2020-04-15').getTime()
  });
  expect(await readPhotoDate(file)).toBeNull();
});

it.each(['2011:02:29', '0000:00:00', '2999:01:01'])(
  'ignores an unusable capture date: %s',
  async date => {
    const bytes = Buffer.from(fixtureBytes('capture.jpg'));
    const offset = bytes.indexOf('2012:02:29');
    expect(offset).toBeGreaterThan(-1);
    bytes.write(date, offset);
    expect(
      await readPhotoDate(new File([bytes], 'invalid-date.jpg'))
    ).toBeNull();
  }
);

it.each(['broken.jpg', 'document.pdf', 'drawing.svg'])(
  'ignores malformed or unsupported files: %s',
  async name => {
    expect(await readPhotoDate(new File(['invalid'], name))).toBeNull();
  }
);
