<template>
  <div class="iframe-page">
    <iframe
      src="/docs/DPDC_C2M_Operations_Manual_screenshots.html"
      title="DPDC C2M Operations Manual"
      class="doc-iframe"
      allowfullscreen
    ></iframe>
  </div>
</template>

<style scoped>
/* Escape AppLayout's p-4 / lg:p-6 padding and max-w wrapper */
.iframe-page {
  margin: -1rem;          /* undo p-4 (16px) */
  height: calc(100vh - 64px - 2 * 1rem);
  overflow: hidden;
}

@media (min-width: 1024px) {
  .iframe-page {
    margin: -1.5rem;      /* undo lg:p-6 (24px) */
    height: calc(100vh - 64px - 2 * 1.5rem);
  }
}

.doc-iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
  background: #eef2f7;
}
</style>
