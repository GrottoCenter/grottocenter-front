import ImportResultRecap from './ImportResultRecap';

const meta = {
  title: 'ImportCSV/ImportResultRecap',
  component: ImportResultRecap
};

export default meta;

const reportUrls = {
  success: 'https://example.org/report-success.csv',
  duplicates: 'https://example.org/report-duplicates.csv',
  failures: 'https://example.org/report-failures.csv'
};

// Fully successful completed job, with downloadable reports.
export const Success = {
  args: {
    status: 'completed',
    progress: {
      totalRows: 10,
      processedRows: 10,
      successes: 8,
      duplicates: 2,
      failures: 0
    },
    reportUrls
  }
};

// Some rows failed — partial outcome (warning banner).
export const Partial = {
  args: {
    status: 'completed',
    progress: {
      totalRows: 10,
      processedRows: 7,
      successes: 6,
      duplicates: 1,
      failures: 3
    },
    reportUrls
  }
};

// Everything failed — error banner.
export const TotalFailure = {
  args: {
    status: 'failed',
    progress: {
      totalRows: 5,
      processedRows: 0,
      successes: 0,
      duplicates: 0,
      failures: 5
    },
    reportUrls: null
  }
};

// Backend reports `failed` while the counts show a full success (no report
// URLs on this path) — shows the honesty note and the technical status chip.
export const InconsistentBackendFailure = {
  args: {
    status: 'failed',
    progress: {
      totalRows: 1,
      processedRows: 1,
      successes: 1,
      duplicates: 0,
      failures: 0
    },
    reportUrls: null
  }
};
