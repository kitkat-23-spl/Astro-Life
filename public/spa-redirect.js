// GitHub Pages deep-link support: remember the requested path, then load the app.
;(function () {
  var base = document.currentScript.getAttribute('data-base') || '/'
  try {
    sessionStorage.setItem('astrolife:redirect', location.pathname + location.search + location.hash)
  } catch (e) {
    // Storage blocked: fall back to the home page.
  }
  location.replace(base)
})()
