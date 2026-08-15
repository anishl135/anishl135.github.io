/* ============================================================
   Blog feed - fetches posts from a Google Apps Script web app.
   Update the Google Doc, refresh the page, new content appears.
   ============================================================ */

(function () {
  'use strict';

  // 1. Deploy the Apps Script (apps-script/Code.gs) as a web app with
  //    "Anyone" access, then paste the /exec URL here:
  const FEED_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

  const postsList = document.getElementById('blogPosts');
  const postsSection = document.getElementById('blogPostsSection');
  const heroTitle = document.getElementById('blogHeroTitle');
  const heroNote = document.getElementById('blogHeroNote');
  const comingSoonTag = document.getElementById('blogComingSoonTag');
  const videoLabel = document.getElementById('blogVideoLabel');
  const feedStatus = document.getElementById('blogFeedStatus');

  if (!postsList) return;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function linkify(text) {
    return escapeHtml(text).replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener">$1</a>'
    );
  }

  function renderPost(post) {
    const article = document.createElement('article');
    article.className = 'card blog-post';

    let head = '<div class="card-top mono"><span class="card-tag">Blog post</span>';
    if (post.date) head += '<span class="card-date">' + escapeHtml(post.date) + '</span>';
    head += '</div>';

    article.innerHTML = head + '<h3 class="card-title sm">' + escapeHtml(post.title) + '</h3>';

    const body = document.createElement('div');
    body.className = 'blog-post-body';

    let inList = false;
    const closeList = () => {
      if (inList) {
        body.appendChild(document.createElement('ul'));
        inList = false;
      }
    };

    (post.blocks || []).forEach((b) => {
      if (b.type === 'h3') {
        closeList();
        const h = document.createElement('h4');
        h.textContent = b.text;
        body.appendChild(h);
      } else if (b.type === 'li') {
        if (!inList) {
          inList = true;
          body.appendChild(document.createElement('ul'));
        }
        const li = document.createElement('li');
        li.innerHTML = linkify(b.text);
        body.lastChild.appendChild(li);
      } else {
        closeList();
        const p = document.createElement('p');
        p.innerHTML = linkify(b.text);
        body.appendChild(p);
      }
    });
    closeList();

    article.appendChild(body);
    return article;
  }

  function setStatus(msg) {
    if (feedStatus) feedStatus.textContent = msg || '';
  }

  function showComingSoon(msg) {
    setStatus(msg || '');
  }

  function showPosts(data) {
    if (postsSection) postsSection.hidden = false;

    const count = data.count != null ? data.count : (data.posts || []).length;
    if (heroTitle) heroTitle.textContent = 'Notes from the bench.';
    if (heroNote) {
      heroNote.textContent = count + (count === 1 ? ' post' : ' posts') + ' and counting.';
    }
    if (comingSoonTag) comingSoonTag.textContent = 'live';
    if (videoLabel) videoLabel.textContent = 'Watch';

    (data.posts || []).forEach((post) => postsList.appendChild(renderPost(post)));

    // Let GSAP/ScrollTrigger recompute positions for the newly added cards.
    if (window.ScrollTrigger && window.ScrollTrigger.refresh) {
      window.ScrollTrigger.refresh();
    }
  }

  async function load() {
    if (!FEED_URL || FEED_URL.indexOf('PASTE_') === 0) {
      showComingSoon('Blog feed not configured yet - add the /exec URL to src/blog.js.');
      return;
    }
    try {
      const res = await fetch(FEED_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (!data.posts || !data.posts.length) {
        showComingSoon('');
        return;
      }
      showPosts(data);
      setStatus('');
    } catch (err) {
      showComingSoon('Could not load the blog feed. Coming soon instead.');
      console.error('Blog feed error:', err);
    }
  }

  load();
})();
