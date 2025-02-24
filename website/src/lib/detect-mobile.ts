const regex =
  /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export const isMobile = regex.test(navigator.userAgent);
