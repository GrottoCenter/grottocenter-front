const TRACE_ID_PATTERN = /^[\w-]{1,128}$/;

export const readTraceId = headers => {
  const value = headers?.get('X-Trace-Id')?.trim();
  return value && TRACE_ID_PATTERN.test(value) ? value : undefined;
};
