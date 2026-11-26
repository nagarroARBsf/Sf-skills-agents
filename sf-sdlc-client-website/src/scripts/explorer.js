// Plugin-structure explorer (#structure): renders the two trees and the detail pane.
// Data lives in explorer-data.js. Does nothing when the section is not on the page.
(function () {
  if (!document.getElementById('detail') || !window.SFSDLC_EXPLORER) return;
  var PLUGIN = window.SFSDLC_EXPLORER.PLUGIN;
  var PROJECT = window.SFSDLC_EXPLORER.PROJECT;

  var KIND = {
    gen: ['gen', 'Generated from .claude/'],
    hand: ['hand', 'Hand-written'],
    proj: ['proj', 'In your project']
  };

  var FOLDER = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';
  var FILE = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>';

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function codeText(id) { var el = document.getElementById(id); return el ? el.textContent.replace(/^\n+|\s+$/g, '') : ''; }

  var detail = document.getElementById('detail');
  var all = {};

  function buildTree(listEl, items) {
    items.forEach(function (it) {
      all[it.id] = it;
      var li = document.createElement('li');
      li.setAttribute('role', 'none');
      var b = document.createElement('button');
      b.setAttribute('role', 'treeitem');
      b.dataset.id = it.id;
      b.dataset.depth = it.depth;
      b.style.paddingLeft = (20 + it.depth * 20) + 'px';
      b.innerHTML = (it.folder ? FOLDER : FILE) + '<span>' + esc(it.label) + '</span>' + (it.kind ? '<i class="dot ' + it.kind + '"></i>' : '');
      b.addEventListener('click', function () { select(it.id, listEl); });
      li.appendChild(b);
      listEl.appendChild(li);
    });
  }

  function select(id, listEl) {
    var it = all[id];
    var buttons = listEl.querySelectorAll('button');
    var idx = -1;
    buttons.forEach(function (b, i) { b.classList.remove('selected', 'child-of-selected'); if (b.dataset.id === id) idx = i; });
    if (idx >= 0) {
      buttons[idx].classList.add('selected');
      var d = +buttons[idx].dataset.depth;
      if (all[id].folder) {
        for (var j = idx + 1; j < buttons.length && +buttons[j].dataset.depth > d; j++) buttons[j].classList.add('child-of-selected');
      }
    }
    var badges = '';
    if (it.kind) badges += '<span class="badge ' + KIND[it.kind][0] + '">' + KIND[it.kind][1] + '</span>';
    badges += '<span class="badge neutral">' + (it.folder ? 'Folder' : 'File') + '</span>';
    var html = '<div class="eyebrow" style="color:var(--muted)">Selected piece</div>' +
      '<h3>' + esc(it.title) + '</h3>' +
      '<span class="detail-path">' + esc(it.path) + '</span>' + badges +
      '<div class="desc">' + it.desc + '</div>' +
      '<div class="kv">' +
        '<div><h5>What you provide or configure</h5>' + (it.provide.indexOf('<ul>') === 0 ? it.provide : '<p>' + it.provide + '</p>') + '</div>' +
        '<div><h5>How to use it</h5><p>' + it.use + '</p></div>' +
      '</div>';
    if (it.code) {
      html += '<div class="code-wrap"><p class="code-label">' + esc(it.codeLabel || '') + '</p><button class="copy" data-copy-text="' + it.code + '">Copy</button><pre><code>' + esc(codeText(it.code)) + '</code></pre></div>';
    }
    detail.innerHTML = html;
  }

  var treePlugin = document.getElementById('tree-plugin');
  var treeProject = document.getElementById('tree-project');
  buildTree(treePlugin, PLUGIN);
  buildTree(treeProject, PROJECT);
  select('skill-md', treePlugin);

  // keyboard: up/down within the visible tree
  [treePlugin, treeProject].forEach(function (tree) {
    tree.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var btns = Array.prototype.slice.call(tree.querySelectorAll('button'));
      var i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var n = btns[Math.max(0, Math.min(btns.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
      n.focus(); n.click();
    });
  });

  // switching between the "plugin" and "your project" trees
  document.querySelectorAll('.seg[data-tabs="tree"] button').forEach(function (b) {
    b.addEventListener('click', function () {
      var isPlugin = b.dataset.target === 'tree-plugin';
      document.getElementById('treeTitle').textContent = isPlugin ? 'Plugin directory' : 'Your project';
      select(isPlugin ? 'skill-md' : 'p-config', isPlugin ? treePlugin : treeProject);
    });
  });
})();
