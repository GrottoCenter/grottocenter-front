const linkifyOptions = {
  attributes: { target: '_blank', rel: 'noopener noreferrer' },
  format: (value, type) => {
    if (type !== 'url') return value;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
};

export default linkifyOptions;
