import { useState } from 'react';

// Parent keys this component by URL so a replacement photo gets a fresh retry.
export default function PhotoWithFallback({ src, alt, className, style, children }) {
  const [failed, setFailed] = useState(false);
  return src && !failed
    ? <img src={src} alt={alt} className={className} style={style} onError={() => setFailed(true)} />
    : children;
}
