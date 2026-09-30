// GitHub Pages deep-link support: remember the requested path, then load the app.
;(function () {
  var base = document.currentScript.getAttribute('data-base') || '/'
  sessionStorage.setItem('astrolife:redirect', location.pathname + location.search + location.hash)
  location.replace(base)
})()
