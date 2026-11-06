import { Font } from '@react-pdf/renderer';
import regular from '@/assets/fonts/pdf/NotoSans-Regular.ttf?url';
import bold from '@/assets/fonts/pdf/NotoSans-Bold.ttf?url';
import arabic from '@/assets/fonts/pdf/NotoSansArabic-Regular.ttf?url';
import hebrew from '@/assets/fonts/pdf/NotoSansHebrew-Regular.ttf?url';
import japanese from '@/assets/fonts/pdf/NotoSansJP.ttf?url';
import math from '@/assets/fonts/pdf/NotoSansMath-Regular.ttf?url';
import symbols from '@/assets/fonts/pdf/NotoSansSymbols2-Regular.ttf?url';

export const PDF_FONT_SOURCES = {
  regular,
  bold,
  arabic,
  hebrew,
  japanese,
  math,
  symbols
};

export const registerPdfFonts = (text, sources = PDF_FONT_SOURCES) => {
  // Font data and glyph subsets must not leak between separate exports.
  Font.clear();
  Font.register({
    family: 'Helvetica',
    fonts: [{ src: 'Helvetica' }, { src: 'Helvetica-Bold', fontWeight: 700 }]
  });
  Font.register({
    family: 'Noto',
    fonts: [{ src: sources.regular }, { src: sources.bold, fontWeight: 700 }]
  });
  const families = ['Noto'];
  for (const [key, pattern] of [
    ['arabic', /[\u0600-\u06ff]/],
    ['hebrew', /[\u0590-\u05ff]/],
    ['japanese', /[\u3000-\u30ff\u3400-\u9fff]/],
    ['math', /[\u2190-\u21ff\u27f0-\u2aff]/],
    ['symbols', /[\u2600-\u27ef\u2b00-\u2bff\u{1f800}-\u{1f8ff}]/u]
  ]) {
    if (!pattern.test(text)) continue;
    Font.register({ family: key, src: sources[key] });
    families.push(key);
  }
  return families;
};
