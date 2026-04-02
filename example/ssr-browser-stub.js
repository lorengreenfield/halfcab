// Browser stub for @lit-labs/ssr used by halfcab.mjs during client-side demo.
// The real SSR renderer is only needed on the server. We export a minimal
// compatible surface so ESM import resolution succeeds in the browser.

export function render() {
  throw new Error("@lit-labs/ssr 'render' is a server-only API and should not be called in the browser.");
}

export default { render };
