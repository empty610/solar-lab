# Shared browser libraries

`three.min.js` is the byte-identical library previously served from Mercury,
Venus, Jupiter, Saturn, Uranus, Neptune, Europa and Pluto. `OrbitControls.js`
is shared by those pages except Venus. See LICENSE for the MIT license.

Existing per-page copies remain available at their original URLs for older
documents. Current pages use these shared URLs, and the build gives them one
common content-addressed URL so navigation reuses the browser cache.

Mars uses a different Three.js/controls pair; Venus has different controls.
Keep those separate. No library version has been changed.
