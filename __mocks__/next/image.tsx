import React from 'react';

const NextImage = ({ src, alt, fill: _fill, ...props }: any) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={typeof src === 'string' ? src : ''} alt={alt} {...props} />
);

export default NextImage;
