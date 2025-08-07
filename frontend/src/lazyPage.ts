import React from "react";

export function lazyPage(path: string) {
  return React.lazy(() => import(`./pages${path === '/' ? '/Dashboard' : path.charAt(0).toUpperCase() + path.slice(1).replace(/\/(\w)/g, (_, c) => c.toUpperCase())}`));
} 