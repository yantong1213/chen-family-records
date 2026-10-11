/**
 * Auto-updating ages from data-birth / data-death on .person cards.
 * ROC labels stay in HTML; Gregorian ISO lives in data-* (民國年 + 1911).
 * Living ages use the client's local "today" so they stay current.
 * Age renders as a small badge on the avatar's bottom-right corner.
 */
(function () {
  'use strict';

  function parseISODate(s) {
    if (!s || typeof s !== 'string') return null;
    var m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(s.trim());
    if (!m) return null;
    var y = +m[1];
    var mo = m[2] != null ? +m[2] : null;
    var d = m[3] != null ? +m[3] : null;
    if (mo == null) {
      // Year-only → Dec 31 year-end approx
      return { date: new Date(y, 11, 31), approx: true };
    }
    if (d == null) {
      // Year-month → last day of that month
      return { date: new Date(y, mo, 0), approx: true };
    }
    return { date: new Date(y, mo - 1, d), approx: false };
  }

  function ageOn(birthDate, asOf) {
    var age = asOf.getFullYear() - birthDate.getFullYear();
    var md = asOf.getMonth() - birthDate.getMonth();
    if (md < 0 || (md === 0 && asOf.getDate() < birthDate.getDate())) age--;
    return age;
  }

  function ensureAgeBadge(person) {
    var avatar = person.querySelector('.avatar');
    if (!avatar) return null;

    // Remove any leftover age spans previously placed in .pmeta
    var meta = person.querySelector('.pmeta');
    if (meta) {
      var oldMeta = meta.querySelectorAll('.age');
      for (var i = 0; i < oldMeta.length; i++) oldMeta[i].remove();
    }

    var span = avatar.querySelector('.age');
    if (span) return span;

    span = document.createElement('span');
    span.className = 'age';
    span.setAttribute('aria-live', 'polite');
    avatar.appendChild(span);
    return span;
  }

  function renderPerson(person) {
    var birthAttr = person.getAttribute('data-birth');
    if (!birthAttr) return;

    var birth = parseISODate(birthAttr);
    if (!birth) return;

    var deathAttr = person.getAttribute('data-death');
    var deceasedFlag =
      person.hasAttribute('data-deceased') ||
      !!deathAttr ||
      !!person.querySelector('.tag-passed');

    if (deathAttr) {
      var death = parseISODate(deathAttr);
      var span = ensureAgeBadge(person);
      if (!span) return;
      if (!death) {
        span.textContent = '';
        span.hidden = true;
        return;
      }
      var atDeath = ageOn(birth.date, death.date);
      // Compact badge: number + 歲; 享壽/得年 in title
      span.textContent = atDeath + '歲';
      span.classList.add('age-passed');
      span.title =
        (atDeath >= 60 ? '享壽' : '得年') + atDeath + '歲（依忌日計算）';
      span.hidden = false;
      return;
    }

    if (deceasedFlag) {
      // Death date unknown: keep 「已故」, never show a live age
      return;
    }

    var spanLive = ensureAgeBadge(person);
    if (!spanLive) return;

    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var age = ageOn(birth.date, today);
    if (age < 0) age = 0;

    spanLive.classList.remove('age-passed');
    spanLive.hidden = false;

    if (birth.approx || person.hasAttribute('data-birth-approx')) {
      spanLive.textContent = '約' + age + '歲';
      spanLive.title = '僅知出生年（或年月），以年底／月末估算';
      spanLive.classList.add('age-approx');
    } else {
      // No 「現年」— just the number
      spanLive.textContent = age + '歲';
      spanLive.title = '依今天自動計算，過生日後會更新';
      spanLive.classList.remove('age-approx');
    }
  }

  function updateAll() {
    var nodes = document.querySelectorAll('.person[data-birth]');
    for (var i = 0; i < nodes.length; i++) renderPerson(nodes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAll);
  } else {
    updateAll();
  }
})();
