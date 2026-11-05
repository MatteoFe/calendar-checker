// Builds the contact link at runtime so the address never appears whole in the HTML source.
// Plain JavaScript on purpose: this is a static page, not part of the extension build.
(function () {
  var user = ['pri', 'vacy'].join('');
  var domain = ['calendar-checker', 'zoomi', 'it'].join('.');
  var address = user + '@' + domain;
  document.querySelectorAll('[data-contact]').forEach(function (element) {
    var link = document.createElement('a');
    link.href = 'mailto:' + address;
    link.textContent = address;
    element.replaceChildren(link);
  });
})();
