const fadeOut = (target, onFadedOut) => {
  target.classList.add('fadeOut');
  setTimeout(() => {
    onFadedOut();
  }, 500);
};

export default fadeOut;
