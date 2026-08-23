export const MASONRY_ROW_HEIGHT = 1;

export const calculateMasonryRowSpan = (contentHeight, verticalGap) => {
  if (!Number.isFinite(contentHeight) || contentHeight <= 0) return 1;
  return Math.max(
    1,
    Math.ceil((contentHeight + verticalGap) / MASONRY_ROW_HEIGHT)
  );
};
