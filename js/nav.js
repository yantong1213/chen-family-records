(function () {
  var toggle = document.querySelector('.nav-toggle');
  var drawer = document.getElementById('site-menu');
  if (!toggle || !drawer) return;

  var panel = drawer.querySelector('.nav-panel');
  var backdrop = drawer.querySelector('.nav-backdrop');
  var closeBtn = drawer.querySelector('.nav-close');
  var groupBtn = drawer.querySelector('.nav-group-toggle');
  var group = drawer.querySelector('.nav-group');

  function openMenu() {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
    if (closeBtn) closeBtn.focus();
  }

  function closeMenu() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    toggle.focus();
  }

  function isOpen() {
    return drawer.classList.contains('open');
  }

  toggle.addEventListener('click', function () {
    if (isOpen()) closeMenu();
    else openMenu();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (backdrop) backdrop.addEventListener('click', closeMenu);

  drawer.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  if (groupBtn && group) {
    groupBtn.addEventListener('click', function () {
      var expanded = group.classList.toggle('expanded');
      groupBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
    if (document.body.dataset.page === 'index') {
      group.classList.add('expanded');
      groupBtn.setAttribute('aria-expanded', 'true');
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) closeMenu();
  });
})();
