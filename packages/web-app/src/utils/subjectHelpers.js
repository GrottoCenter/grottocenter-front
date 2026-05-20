export const SUBJECT_DEPTH_STYLES = [
  { fontWeight: 700, textTransform: 'uppercase', pl: 0 },
  { fontWeight: 600, pl: 1 },
  { fontWeight: 400, pl: 2 },
  { fontWeight: 400, pl: 3, color: 'text.secondary' }
];

export const getSubjectCode = option => (option.id ?? option.code ?? '').trim();

export const sortSubjects = subjects =>
  [...subjects].sort((a, b) => {
    const aParts = getSubjectCode(a).split('.').filter(Boolean).map(Number);
    const bParts = getSubjectCode(b).split('.').filter(Boolean).map(Number);
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const diff = (aParts[i] ?? -1) - (bParts[i] ?? -1);
      if (diff !== 0) return diff;
    }
    return 0;
  });
