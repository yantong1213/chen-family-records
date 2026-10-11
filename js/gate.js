/**
 * Lightweight client-side password gate.
 * Change PASSWORD below to update the shared family password.
 * This is NOT high security — anyone can read the password from this file.
 * It only blocks casual visitors on a static site.
 */
(function () {
  var PASSWORD = '1151004';
  var STORAGE_KEY = 'chen-family-unlocked';

  function isUnlocked() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function setUnlocked() {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (e) { /* private mode etc. */ }
  }

  if (isUnlocked()) return;

  document.documentElement.classList.add('pw-locked');

  function unlock() {
    setUnlocked();
    document.documentElement.classList.remove('pw-locked');
    var gate = document.getElementById('pw-gate');
    if (gate) gate.remove();
  }

  function showGate() {
    if (document.getElementById('pw-gate')) return;

    var gate = document.createElement('div');
    gate.id = 'pw-gate';
    gate.className = 'pw-gate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-labelledby', 'pw-gate-title');
    gate.innerHTML =
      '<div class="pw-gate-card">' +
        '<p class="pw-gate-kicker">陳 家 紀 錄</p>' +
        '<h1 id="pw-gate-title" class="pw-gate-title">家人專用｜請輸入密碼</h1>' +
        '<p class="pw-gate-hint">此網站僅供家人瀏覽</p>' +
        '<form class="pw-gate-form" autocomplete="off">' +
          '<label class="pw-gate-label" for="pw-input">密碼</label>' +
          '<input class="pw-gate-input" id="pw-input" type="password" name="password" autocomplete="current-password" required autofocus>' +
          '<button class="pw-gate-btn" type="submit">進入</button>' +
          '<p class="pw-gate-error" id="pw-error" hidden>密碼不正確，請再試一次</p>' +
        '</form>' +
        '<p class="pw-gate-warn">請勿將密碼或連結外流。頁面含家人姓名、生日等個人資料。</p>' +
      '</div>';

    (document.body || document.documentElement).appendChild(gate);

    var form = gate.querySelector('.pw-gate-form');
    var input = gate.querySelector('#pw-input');
    var error = gate.querySelector('#pw-error');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = (input.value || '').trim();
      if (value === PASSWORD) {
        unlock();
        return;
      }
      error.hidden = false;
      input.value = '';
      input.focus();
      input.classList.add('pw-gate-shake');
      setTimeout(function () {
        input.classList.remove('pw-gate-shake');
      }, 400);
    });

    input.addEventListener('input', function () {
      error.hidden = true;
    });

    setTimeout(function () {
      try { input.focus(); } catch (e) {}
    }, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showGate);
  } else {
    showGate();
  }
})();
