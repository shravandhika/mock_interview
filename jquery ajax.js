/**
 * ============================================================
 *  InterviewAI — jQuery & AJAX Integration
 *  jquery-ajax.js
 *  
 *  Covers:
 *  1.  DOM Manipulation with jQuery
 *  2.  AJAX calls ($.ajax, $.get, $.post, $.getJSON)
 *  3.  jQuery Event Handling (30 + events)
 *  4.  jQuery Animations & Effects
 *  5.  jQuery Form Handling & Validation
 *  6.  jQuery UI helpers
 *  7.  Simulated API endpoints (JSONPlaceholder / mock)
 * ============================================================
 */

$(document).ready(function () {

  /* ─────────────────────────────────────────────
     0.  CONFIGURATION
  ───────────────────────────────────────────── */
  const CONFIG = {
    mockApiBase   : 'https://jsonplaceholder.typicode.com',
    mockQuotesApi : 'https://api.quotable.io/random',
    ajaxTimeout   : 8000,
    debugMode     : true
  };

  function log(...args) {
    if (CONFIG.debugMode) console.log('[InterviewAI jQuery]', ...args);
  }

  /* ─────────────────────────────────────────────
     1.  JQUERY DOM MANIPULATION
  ───────────────────────────────────────────── */

  // 1a. Inject jQuery-powered toast container
  if ($('#jq-toast-container').length === 0) {
    $('body').append(`
      <div id="jq-toast-container"
           style="position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;
                  flex-direction:column;gap:10px;pointer-events:none;"></div>
    `);
  }

  // 1b. Inject AJAX status bar at the top
  if ($('#jq-ajax-bar').length === 0) {
    $('body').prepend(`
      <div id="jq-ajax-bar"
           style="position:fixed;top:0;left:0;width:0%;height:3px;
                  background:linear-gradient(90deg,#4f46e5,#a855f7);
                  z-index:99999;transition:width .4s ease;"></div>
    `);
  }

  function showToast(message, type = 'info', duration = 3500) {
    const colors = {
      success : '#10b981',
      error   : '#ef4444',
      warning : '#f59e0b',
      info    : '#4f46e5'
    };
    const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
    const $toast = $(`
      <div style="background:#1e1b4b;color:#fff;padding:14px 20px;border-radius:12px;
                  border-left:4px solid ${colors[type]};box-shadow:0 8px 30px rgba(0,0,0,.4);
                  font-family:'DM Sans',sans-serif;font-size:14px;pointer-events:all;
                  max-width:320px;display:flex;align-items:center;gap:10px;opacity:0;">
        <span style="font-size:18px;">${icons[type]}</span>
        <span>${message}</span>
      </div>
    `);
    $('#jq-toast-container').append($toast);
    $toast.animate({ opacity: 1 }, 300);
    setTimeout(() => $toast.animate({ opacity: 0 }, 400, function() { $(this).remove(); }), duration);
  }

  function ajaxBarProgress(pct) {
    $('#jq-ajax-bar').css('width', pct + '%');
    if (pct >= 100) setTimeout(() => $('#jq-ajax-bar').css('width', '0%'), 500);
  }

  /* ─────────────────────────────────────────────
     2.  GLOBAL AJAX SETUP ($.ajaxSetup)
  ───────────────────────────────────────────── */
  $.ajaxSetup({
    timeout : CONFIG.ajaxTimeout,
    headers : {
      'X-Requested-With' : 'XMLHttpRequest',
      'Accept'           : 'application/json'
    }
  });

  // Global AJAX hooks
  $(document)
    .ajaxStart(function ()       { ajaxBarProgress(30); log('AJAX started'); })
    .ajaxSend(function ()        { ajaxBarProgress(60); })
    .ajaxComplete(function ()    { ajaxBarProgress(100); log('AJAX complete'); })
    .ajaxError(function (e, xhr) {
      log('AJAX error', xhr.status, xhr.statusText);
      showToast(`Network error (${xhr.status || 'timeout'})`, 'error');
    });

  /* ─────────────────────────────────────────────
     3.  API SERVICE LAYER
  ───────────────────────────────────────────── */

  const API = {

    /** Fetch blog/tip posts (GET) */
    fetchPosts: function (count = 6) {
      return $.ajax({
        url    : `${CONFIG.mockApiBase}/posts`,
        method : 'GET',
        data   : { _limit: count }
      });
    },

    /** Fetch user profile (GET) */
    fetchUser: function (id = 1) {
      return $.ajax({
        url    : `${CONFIG.mockApiBase}/users/${id}`,
        method : 'GET'
      });
    },

    /** Submit interview answers (POST – simulated) */
    submitAnswers: function (payload) {
      return $.ajax({
        url         : `${CONFIG.mockApiBase}/posts`,   // mock endpoint
        method      : 'POST',
        contentType : 'application/json',
        data        : JSON.stringify(payload)
      });
    },

    /** Save user profile (PUT – simulated) */
    updateProfile: function (id, data) {
      return $.ajax({
        url         : `${CONFIG.mockApiBase}/users/${id}`,
        method      : 'PUT',
        contentType : 'application/json',
        data        : JSON.stringify(data)
      });
    },

    /** Delete a saved result (DELETE – simulated) */
    deleteResult: function (id) {
      return $.ajax({
        url    : `${CONFIG.mockApiBase}/posts/${id}`,
        method : 'DELETE'
      });
    },

    /** $.getJSON shorthand */
    fetchComments: function () {
      return $.getJSON(`${CONFIG.mockApiBase}/comments?_limit=5`);
    },

    /** Fetch motivational quote */
    fetchQuote: function () {
      return $.ajax({
        url     : CONFIG.mockQuotesApi,
        method  : 'GET',
        timeout : 5000
      });
    }
  };

  /* ─────────────────────────────────────────────
     4.  DYNAMIC BLOG / TIP CARDS (AJAX + DOM)
  ───────────────────────────────────────────── */

  function renderBlogCards(posts) {
    const $section = $('.blog-scroll, .blogs-section, #blog-section').first();
    if (!$section.length) return;

    // Create or reuse the jQuery-driven track
    let $track = $section.find('#jq-blog-track');
    if (!$track.length) {
      $track = $('<div id="jq-blog-track" style="display:flex;gap:24px;overflow-x:auto;' +
                 'padding:16px 0;scroll-behavior:smooth;"></div>');
      $section.append($track);
    }
    $track.empty();

    const categories = ['Interview Tips','Career Advice','Tech Skills','Soft Skills','Resume','Networking'];
    const gradients  = [
      'linear-gradient(135deg,#4f46e5,#7c3aed)',
      'linear-gradient(135deg,#0891b2,#0e7490)',
      'linear-gradient(135deg,#059669,#047857)',
      'linear-gradient(135deg,#d97706,#b45309)',
      'linear-gradient(135deg,#dc2626,#b91c1c)',
      'linear-gradient(135deg,#7c3aed,#6d28d9)'
    ];

    posts.forEach(function (post, i) {
      const $card = $(`
        <div class="jq-blog-card" data-id="${post.id}"
             style="min-width:280px;max-width:280px;background:#1e1b4b;border-radius:16px;
                    overflow:hidden;cursor:pointer;flex-shrink:0;
                    box-shadow:0 4px 20px rgba(0,0,0,.3);transition:transform .3s;">
          <div style="height:140px;background:${gradients[i % gradients.length]};
                      display:flex;align-items:center;justify-content:center;font-size:40px;">
            📝
          </div>
          <div style="padding:16px;">
            <span style="font-size:11px;color:#a78bfa;font-weight:600;text-transform:uppercase;
                         letter-spacing:1px;">${categories[i % categories.length]}</span>
            <h4 style="color:#fff;font-size:15px;margin:8px 0;line-height:1.4;">
              ${post.title.substring(0, 55)}...
            </h4>
            <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0 0 12px;">
              ${post.body.substring(0, 80)}...
            </p>
            <button class="jq-read-more" data-id="${post.id}"
                    style="background:transparent;border:1px solid #4f46e5;color:#a78bfa;
                           padding:6px 14px;border-radius:8px;cursor:pointer;font-size:13px;">
              Read More
            </button>
          </div>
        </div>
      `);
      $track.append($card);
    });

    log(`Rendered ${posts.length} blog cards via AJAX`);
  }

  function loadBlogPosts() {
    showToast('Loading career tips...', 'info', 2000);
    API.fetchPosts(8)
      .done(function (posts) {
        renderBlogCards(posts);
        showToast('Career tips loaded!', 'success', 2000);
      })
      .fail(function () {
        showToast('Could not load tips — showing cached content', 'warning');
      });
  }

  // Load blogs 1s after page ready (non-blocking)
  setTimeout(loadBlogPosts, 1000);

  /* ─────────────────────────────────────────────
     5.  MOTIVATIONAL QUOTE WIDGET
  ───────────────────────────────────────────── */

  function injectQuoteWidget() {
    if ($('#jq-quote-widget').length) return;
    const $widget = $(`
      <div id="jq-quote-widget"
           style="position:fixed;bottom:24px;left:24px;max-width:280px;
                  background:linear-gradient(135deg,#1e1b4b,#312e81);
                  border:1px solid #4f46e5;border-radius:16px;padding:16px;
                  box-shadow:0 8px 30px rgba(0,0,0,.4);z-index:998;display:none;
                  font-family:'DM Sans',sans-serif;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="color:#a78bfa;font-size:12px;font-weight:600;text-transform:uppercase;
                       letter-spacing:1px;">💬 Daily Motivation</span>
          <button id="jq-close-quote" style="background:none;border:none;color:#64748b;
                  cursor:pointer;font-size:16px;">✕</button>
        </div>
        <p id="jq-quote-text" style="color:#e2e8f0;font-size:14px;line-height:1.6;
           margin:0 0 8px;font-style:italic;">"Loading..."</p>
        <p id="jq-quote-author" style="color:#7c3aed;font-size:12px;margin:0;
           font-weight:600;">— Author</p>
        <button id="jq-refresh-quote"
                style="margin-top:12px;background:#4f46e5;border:none;color:#fff;
                       padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;
                       width:100%;">🔄 New Quote</button>
      </div>
    `);
    $('body').append($widget);
    $widget.slideDown(400);

    $('#jq-close-quote').on('click', function () {
      $widget.slideUp(300, () => $widget.remove());
    });

    $('#jq-refresh-quote').on('click', function () {
      fetchAndShowQuote();
    });
  }

  function fetchAndShowQuote() {
    $('#jq-quote-text').text('"Fetching inspiration..."').css('opacity', 0.5);
    $.ajax({
      url     : 'https://api.quotable.io/random?tags=success|inspirational',
      method  : 'GET',
      timeout : 5000
    })
    .done(function (data) {
      if (data && data.content) {
        $('#jq-quote-text').text(`"${data.content}"`).animate({ opacity: 1 }, 300);
        $('#jq-quote-author').text(`— ${data.author}`);
      }
    })
    .fail(function () {
      const fallback = [
        { q: '"Success is not final; failure is not fatal."', a: '— Winston Churchill' },
        { q: '"The secret of getting ahead is getting started."', a: '— Mark Twain' },
        { q: '"Believe you can and you\'re halfway there."', a: '— Theodore Roosevelt' }
      ];
      const pick = fallback[Math.floor(Math.random() * fallback.length)];
      $('#jq-quote-text').text(pick.q).animate({ opacity: 1 }, 300);
      $('#jq-quote-author').text(pick.a);
    });
  }

  // Show quote widget after 5s
  setTimeout(function () {
    injectQuoteWidget();
    fetchAndShowQuote();
  }, 5000);

  /* ─────────────────────────────────────────────
     6.  LOGIN AJAX (simulated)
  ───────────────────────────────────────────── */

  $(document).on('submit', '#login-form, .login-form', function (e) {
    e.preventDefault();
    const $form  = $(this);
    const $btn   = $form.find('button[type="submit"]');
    const email  = $form.find('input[type="email"]').val().trim();
    const pass   = $form.find('input[type="password"]').val().trim();

    if (!email || !pass) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    $btn.prop('disabled', true).text('Signing in...');

    // Simulate POST login
    $.ajax({
      url         : `${CONFIG.mockApiBase}/posts`,
      method      : 'POST',
      contentType : 'application/json',
      data        : JSON.stringify({ email, password: '***' })
    })
    .done(function () {
      showToast('Login successful! Welcome back 🎉', 'success');
      localStorage.setItem('jq_user', JSON.stringify({ email, loggedIn: true }));
      updateNavForLoggedInUser(email);
    })
    .fail(function () {
      showToast('Login failed. Please try again.', 'error');
    })
    .always(function () {
      $btn.prop('disabled', false).text('Sign In');
    });
  });

  /* ─────────────────────────────────────────────
     7.  SIGNUP AJAX (simulated)
  ───────────────────────────────────────────── */

  $(document).on('submit', '#signup-form, .signup-form', function (e) {
    e.preventDefault();
    const $form = $(this);
    const $btn  = $form.find('button[type="submit"]');
    const name  = $form.find('input[name="name"], #name').val().trim();
    const email = $form.find('input[type="email"]').val().trim();

    if (!name || !email) {
      showToast('Please complete all required fields', 'warning');
      return;
    }

    $btn.prop('disabled', true).text('Creating account...');

    API.fetchUser(1)   // simulate "create user" with a GET for demo
      .done(function () {
        showToast(`Account created for ${name}! Check your email ✉️`, 'success', 4000);
      })
      .fail(function () {
        showToast('Signup failed. Please try again.', 'error');
      })
      .always(function () {
        $btn.prop('disabled', false).text('Create Account');
      });
  });

  /* ─────────────────────────────────────────────
     8.  INTERVIEW ANSWER SUBMISSION (AJAX)
  ───────────────────────────────────────────── */

  $(document).on('click', '#submit-interview, .submit-all-answers', function () {
    const answers = JSON.parse(localStorage.getItem('interview_answers') || '[]');
    if (!answers.length) {
      showToast('No answers to submit yet!', 'warning');
      return;
    }

    const $btn = $(this);
    $btn.prop('disabled', true).text('Submitting...');
    showToast('Submitting your answers...', 'info', 2000);

    API.submitAnswers({ answers, timestamp: Date.now() })
      .done(function (data) {
        log('Answers submitted, server id:', data.id);
        showToast('Answers submitted successfully! 🎯', 'success');
        localStorage.setItem('submission_id', data.id);
      })
      .fail(function () {
        showToast('Submission failed — answers saved locally', 'warning');
      })
      .always(function () {
        $btn.prop('disabled', false).text('Submit Answers');
      });
  });

  /* ─────────────────────────────────────────────
     9.  DELETE SAVED RESULT (AJAX)
  ───────────────────────────────────────────── */

  $(document).on('click', '.delete-result', function () {
    const id  = $(this).data('id') || 1;
    const $el = $(this).closest('.result-card, .jq-blog-card');

    if (!confirm('Delete this result?')) return;

    API.deleteResult(id)
      .done(function () {
        $el.fadeOut(400, function () { $(this).remove(); });
        showToast('Result deleted', 'success', 2000);
      })
      .fail(function () {
        showToast('Delete failed', 'error');
      });
  });

  /* ─────────────────────────────────────────────
     10. LOAD COMMENTS / TESTIMONIALS ($.getJSON)
  ───────────────────────────────────────────── */

  function loadTestimonials() {
    API.fetchComments()
      .done(function (comments) {
        renderTestimonials(comments);
        log('Testimonials loaded via $.getJSON');
      })
      .fail(function () {
        log('Could not load testimonials');
      });
  }

  function renderTestimonials(comments) {
    const $section = $('.testimonials-section, #testimonials').first();
    if (!$section.length) return;

    let $grid = $section.find('#jq-testimonials-grid');
    if (!$grid.length) {
      $section.append(`
        <h3 style="color:#fff;text-align:center;margin-bottom:24px;
                   font-family:'Playfair Display',serif;">What Our Users Say</h3>
        <div id="jq-testimonials-grid"
             style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));
                    gap:20px;padding:0 20px;"></div>
      `);
      $grid = $section.find('#jq-testimonials-grid');
    }
    $grid.empty();

    comments.slice(0, 4).forEach(function (c) {
      const $card = $(`
        <div class="jq-testimonial-card" style="background:#1e1b4b;border-radius:16px;
             padding:20px;border:1px solid #312e81;opacity:0;">
          <p style="color:#e2e8f0;font-size:14px;font-style:italic;
                    line-height:1.6;margin-bottom:12px;">"${c.body.substring(0,120)}..."</p>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;background:linear-gradient(135deg,#4f46e5,#7c3aed);
                        border-radius:50%;display:flex;align-items:center;justify-content:center;
                        color:#fff;font-weight:700;font-size:14px;">
              ${c.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style="color:#fff;font-size:13px;font-weight:600;margin:0;">${c.name.split(' ').slice(0,2).join(' ')}</p>
              <p style="color:#7c3aed;font-size:11px;margin:0;">⭐⭐⭐⭐⭐</p>
            </div>
          </div>
        </div>
      `);
      $grid.append($card);
      $card.delay(200).animate({ opacity: 1 }, 500);
    });
  }

  setTimeout(loadTestimonials, 2000);

  /* ─────────────────────────────────────────────
     11. REAL-TIME SEARCH / FILTER (AJAX + jQuery)
  ───────────────────────────────────────────── */

  // Inject search bar near FAQ or blog sections
  function injectSearchBar() {
    if ($('#jq-search-bar').length) return;
    const $faq = $('.faq-section, #faq-section').first();
    if (!$faq.length) return;

    $faq.prepend(`
      <div style="text-align:center;margin-bottom:24px;">
        <input id="jq-search-bar" type="text" placeholder="🔍  Search FAQs and tips..."
               style="width:100%;max-width:500px;padding:12px 20px;border-radius:12px;
                      border:1px solid #4f46e5;background:#1e1b4b;color:#fff;
                      font-size:15px;font-family:'DM Sans',sans-serif;outline:none;" />
      </div>
    `);
  }

  let searchTimer;
  $(document).on('input', '#jq-search-bar', function () {
    clearTimeout(searchTimer);
    const q = $(this).val().toLowerCase().trim();
    searchTimer = setTimeout(function () {
      if (q.length < 2) return;
      // Filter FAQ items
      $('.faq-item, .accordion-item').each(function () {
        const text = $(this).text().toLowerCase();
        $(this).toggle(text.includes(q));
      });
      // Filter blog cards
      $('.jq-blog-card').each(function () {
        const text = $(this).text().toLowerCase();
        $(this).css('opacity', text.includes(q) ? '1' : '0.3');
      });
      log('Search filtered:', q);
    }, 300);
  });

  injectSearchBar();

  /* ─────────────────────────────────────────────
     12. JQUERY EVENT LISTENERS (30+ events)
  ───────────────────────────────────────────── */

  // --- E01: click on nav links ---
  $(document).on('click', '.nav-link, .navbar a', function () {
    $('.nav-link, .navbar a').removeClass('jq-active');
    $(this).addClass('jq-active');
    log('Nav click:', $(this).text().trim());
  });

  // --- E02: hover on cards (mouseenter / mouseleave) ---
  $(document).on('mouseenter', '.jq-blog-card, .card, .feature-card', function () {
    $(this).css('transform', 'translateY(-6px)');
  }).on('mouseleave', '.jq-blog-card, .card, .feature-card', function () {
    $(this).css('transform', 'translateY(0)');
  });

  // --- E03: Read More button click ---
  $(document).on('click', '.jq-read-more', function () {
    const id = $(this).data('id');
    const $card = $(this).closest('.jq-blog-card');
    const $btn  = $(this);
    $btn.text('Loading...').prop('disabled', true);

    $.get(`${CONFIG.mockApiBase}/posts/${id}`)
      .done(function (post) {
        showToast(`"${post.title.substring(0,40)}..." — click to read`, 'info', 4000);
      })
      .fail(function () {
        showToast('Could not load article', 'error');
      })
      .always(function () {
        $btn.text('Read More').prop('disabled', false);
      });
  });

  // --- E04: focus / blur on inputs ---
  $(document).on('focus', 'input, textarea, select', function () {
    $(this).closest('.form-group, .input-wrapper').addClass('jq-focused');
    log('Input focused:', this.id || this.name || this.type);
  }).on('blur', 'input, textarea, select', function () {
    $(this).closest('.form-group, .input-wrapper').removeClass('jq-focused');
  });

  // --- E05: input change validation ---
  $(document).on('change', 'input[type="email"]', function () {
    const val    = $(this).val().trim();
    const valid  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const $group = $(this).closest('.form-group, .input-wrapper');
    $group.removeClass('jq-valid jq-invalid')
          .addClass(valid ? 'jq-valid' : 'jq-invalid');
    if (!valid && val) showToast('Please enter a valid email address', 'warning', 2000);
  });

  // --- E06: keypress Enter to submit forms ---
  $(document).on('keypress', 'input', function (e) {
    if (e.which === 13) {
      $(this).closest('form').submit();
    }
  });

  // --- E07: scroll-to-top button ---
  if ($('#jq-scroll-top').length === 0) {
    $('body').append(`
      <button id="jq-scroll-top"
              style="position:fixed;bottom:80px;right:24px;width:44px;height:44px;
                     background:linear-gradient(135deg,#4f46e5,#7c3aed);border:none;
                     border-radius:50%;color:#fff;font-size:20px;cursor:pointer;
                     box-shadow:0 4px 15px rgba(79,70,229,.5);display:none;z-index:997;
                     transition:transform .2s;">↑</button>
    `);
  }

  $(window).on('scroll.jq', function () {
    if ($(this).scrollTop() > 300) {
      $('#jq-scroll-top').fadeIn(300);
    } else {
      $('#jq-scroll-top').fadeOut(300);
    }
  });

  $(document).on('click', '#jq-scroll-top', function () {
    $('html, body').animate({ scrollTop: 0 }, 600, 'swing');
  });

  $(document).on('mouseenter', '#jq-scroll-top', function () {
    $(this).css('transform', 'scale(1.15)');
  }).on('mouseleave', '#jq-scroll-top', function () {
    $(this).css('transform', 'scale(1)');
  });

  // --- E08: double-click to copy text ---
  $(document).on('dblclick', '.jq-blog-card h4', function () {
    const text = $(this).text();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Title copied to clipboard!', 'success', 1500);
    }
  });

  // --- E09: drag-and-drop file upload enhancement ---
  $(document).on('dragover', '.file-upload, #resume-upload', function (e) {
    e.preventDefault();
    $(this).addClass('jq-drag-over')
           .css({ borderColor: '#a78bfa', background: 'rgba(167,139,250,.1)' });
  }).on('dragleave', '.file-upload, #resume-upload', function () {
    $(this).removeClass('jq-drag-over')
           .css({ borderColor: '', background: '' });
  }).on('drop', '.file-upload, #resume-upload', function (e) {
    e.preventDefault();
    $(this).removeClass('jq-drag-over')
           .css({ borderColor: '', background: '' });
    const file = e.originalEvent.dataTransfer.files[0];
    if (file) {
      $(this).find('p, span').first().text(`📄 ${file.name} (${(file.size/1024).toFixed(1)} KB)`);
      showToast(`Resume "${file.name}" uploaded!`, 'success');
    }
  });

  // --- E10: file input change ---
  $(document).on('change', 'input[type="file"]', function () {
    const file = this.files[0];
    if (!file) return;
    const allowed = ['application/pdf',
                     'application/msword',
                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      showToast('Only PDF or Word documents are accepted', 'warning');
      this.value = '';
      return;
    }
    showToast(`✅ "${file.name}" ready (${(file.size/1024).toFixed(1)} KB)`, 'success');
    log('File selected:', file.name, file.type);
  });

  // --- E11: select / dropdown change ---
  $(document).on('change', 'select', function () {
    const val   = $(this).val();
    const label = $(this).find('option:selected').text();
    showToast(`Selected: ${label}`, 'info', 1500);
    log('Select changed:', val);
  });

  // --- E12: window resize ---
  let resizeTimer;
  $(window).on('resize.jq', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      const w = $(window).width();
      log('Window resized to:', w);
      if (w < 768) {
        $('#jq-quote-widget').hide();
      } else {
        $('#jq-quote-widget').show();
      }
    }, 250);
  });

  // --- E13: window focus / blur ---
  $(window).on('focus.jq', function () {
    log('Window focused — resuming activity');
    document.title = 'InterviewAI – Ace Your Interview';
  }).on('blur.jq', function () {
    log('Window blurred');
    document.title = '👋 Come back — InterviewAI';
  });

  // --- E14: visibility change ---
  $(document).on('visibilitychange.jq', function () {
    if (document.hidden) {
      log('Page hidden — pausing');
    } else {
      log('Page visible — resuming');
    }
  });

  // --- E15: before unload ---
  $(window).on('beforeunload.jq', function () {
    const inProgress = localStorage.getItem('interview_in_progress');
    if (inProgress === 'true') {
      return 'Your interview is in progress. Are you sure you want to leave?';
    }
  });

  // --- E16: contextmenu (right-click) ---
  $(document).on('contextmenu', '.jq-blog-card', function (e) {
    e.preventDefault();
    showToast('Right-click options coming soon!', 'info', 1500);
  });

  // --- E17: touchstart / touchend (mobile) ---
  $(document).on('touchstart', '.jq-blog-card', function () {
    $(this).css('opacity', '0.85');
  }).on('touchend', '.jq-blog-card', function () {
    $(this).css('opacity', '1');
  });

  // --- E18: checkbox change ---
  $(document).on('change', 'input[type="checkbox"]', function () {
    const label = $(this).closest('label').text().trim() ||
                  $(`label[for="${this.id}"]`).text().trim() || this.id;
    log('Checkbox toggled:', label, '→', this.checked);
  });

  // --- E19: radio change ---
  $(document).on('change', 'input[type="radio"]', function () {
    log('Radio selected:', this.value);
  });

  // --- E20: paste event ---
  $(document).on('paste', 'input[type="url"], input[placeholder*="LinkedIn"]', function () {
    setTimeout(() => {
      const val = $(this).val();
      if (val.includes('linkedin.com')) {
        showToast('LinkedIn URL detected ✅', 'success', 1500);
      } else if (val) {
        showToast('Ensure this is your LinkedIn profile URL', 'warning');
      }
    }, 50);
  });

  // --- E21: copy event ---
  $(document).on('copy', function () {
    log('Content copied from page');
  });

  // --- E22: Accordion FAQ toggle ---
  $(document).on('click', '.faq-question, .accordion-header', function () {
    const $answer = $(this).next('.faq-answer, .accordion-body');
    const $icon   = $(this).find('.faq-icon, .toggle-icon');
    const isOpen  = $answer.is(':visible');

    $('.faq-answer, .accordion-body').slideUp(300);
    $('.faq-icon, .toggle-icon').text('+');

    if (!isOpen) {
      $answer.slideDown(300);
      $icon.text('−');
    }
    log('FAQ toggled:', $(this).text().trim().substring(0, 40));
  });

  // --- E23: Smooth scroll on anchor clicks ---
  $(document).on('click', 'a[href^="#"]', function (e) {
    const target = $(this).attr('href');
    if ($(target).length) {
      e.preventDefault();
      $('html, body').animate({ scrollTop: $(target).offset().top - 80 }, 600);
    }
  });

  // --- E24: Navbar mobile menu toggle ---
  $(document).on('click', '.hamburger, .mobile-menu-btn, #menu-toggle', function () {
    const $menu = $('.mobile-nav, .nav-mobile, #mobile-menu');
    $menu.slideToggle(300);
    $(this).toggleClass('active');
    log('Mobile menu toggled');
  });

  // --- E25: Click outside to close dropdowns ---
  $(document).on('click', function (e) {
    if (!$(e.target).closest('.dropdown, .nav-dropdown').length) {
      $('.dropdown-menu, .nav-dropdown .dropdown-content').slideUp(200);
    }
    if (!$(e.target).closest('#jq-context-menu').length) {
      $('#jq-context-menu').hide();
    }
  });

  // --- E26: Lazy load images on scroll ---
  $(window).on('scroll.lazyload', function () {
    $('img[data-src]').each(function () {
      const top  = $(this).offset().top;
      const bot  = $(window).scrollTop() + $(window).height();
      if (top < bot) {
        $(this).attr('src', $(this).data('src')).removeAttr('data-src');
      }
    });
  });

  // --- E27: Input character counter for textareas ---
  $(document).on('input', 'textarea', function () {
    const maxLen = $(this).attr('maxlength') || 500;
    const len    = $(this).val().length;
    let $counter = $(this).siblings('.jq-char-count');
    if (!$counter.length) {
      $counter = $('<small class="jq-char-count" style="color:#94a3b8;font-size:12px;"></small>');
      $(this).after($counter);
    }
    $counter.text(`${len} / ${maxLen}`);
    $counter.css('color', len > maxLen * 0.9 ? '#f59e0b' : '#94a3b8');
  });

  // --- E28: Keyboard shortcut Ctrl+B for blog, Ctrl+L for login ---
  $(document).on('keydown.jq', function (e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        $('html,body').animate({ scrollTop: $('.blog-scroll, #blog-section').offset()?.top - 80 || 0 }, 500);
        showToast('Navigated to Blog section', 'info', 1500);
      }
      if (e.key === 'l') {
        e.preventDefault();
        // Trigger login page
        if (typeof window.showPage === 'function') window.showPage('login');
        showToast('Opening Login...', 'info', 1500);
      }
    }
  });

  // --- E29: Online / offline ---
  $(window).on('online.jq', function () {
    showToast('Back online 🌐', 'success');
    loadBlogPosts();
  }).on('offline.jq', function () {
    showToast('You are offline — some features may be limited', 'warning', 5000);
  });

  // --- E30: Long-press on CTA button ---
  let pressTimer;
  $(document).on('mousedown touchstart', '.cta-btn, .btn-primary', function () {
    pressTimer = setTimeout(() => {
      showToast('Pro tip: Tab through form fields for faster setup!', 'info', 3000);
    }, 800);
  }).on('mouseup touchend mouseleave', '.cta-btn, .btn-primary', function () {
    clearTimeout(pressTimer);
  });

  /* ─────────────────────────────────────────────
     13. JQUERY EFFECTS & ANIMATIONS
  ───────────────────────────────────────────── */

  // Animate score bars on results page
  function animateScoreBars() {
    $('.score-bar, .progress-fill').each(function () {
      const target = $(this).data('score') || $(this).attr('style')?.match(/(\d+)%/)?.[1] || 75;
      $(this).css('width', '0%').animate({ width: target + '%' }, 1200);
    });
  }

  // Intersection Observer → animate when in view
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const $el = $(entry.target);
        $el.addClass('jq-in-view').animate({ opacity: 1 }, 600);
        if ($el.hasClass('score-bar') || $el.hasClass('progress-fill')) {
          animateScoreBars();
        }
      }
    });
  }, { threshold: 0.2 });

  $('[data-animate], .fade-in, .score-bar').each(function () {
    $(this).css('opacity', 0);
    observer.observe(this);
  });

  /* ─────────────────────────────────────────────
     14. UPDATE NAV FOR LOGGED-IN USER
  ───────────────────────────────────────────── */

  function updateNavForLoggedInUser(email) {
    const name = email.split('@')[0];
    const $nav = $('nav, .navbar').first();
    const $loginBtn = $nav.find('a[onclick*="login"], .btn-login, .login-btn').first();
    if ($loginBtn.length) {
      $loginBtn.text(`👤 ${name}`).attr('onclick', '').css({ color: '#a78bfa', fontWeight: '600' });
    }
    const $signupBtn = $nav.find('a[onclick*="signup"], .btn-signup, .signup-btn').first();
    if ($signupBtn.length) {
      $signupBtn.html('Logout').on('click', function () {
        localStorage.removeItem('jq_user');
        location.reload();
      });
    }
  }

  // Restore logged-in state
  const savedUser = JSON.parse(localStorage.getItem('jq_user') || 'null');
  if (savedUser?.loggedIn) {
    updateNavForLoggedInUser(savedUser.email);
  }

  /* ─────────────────────────────────────────────
     15. INTERVIEW PROGRESS — AJAX POLLING
         (simulates saving state every 30s)
  ───────────────────────────────────────────── */

  setInterval(function () {
    const inProgress = localStorage.getItem('interview_in_progress') === 'true';
    if (!inProgress) return;

    const progress = {
      currentQuestion : parseInt(localStorage.getItem('current_question') || '0'),
      answers         : JSON.parse(localStorage.getItem('interview_answers') || '[]'),
      timestamp       : Date.now()
    };

    $.ajax({
      url         : `${CONFIG.mockApiBase}/posts/1`,
      method      : 'PUT',
      contentType : 'application/json',
      data        : JSON.stringify(progress),
      global      : false   // don't trigger global AJAX hooks for silent save
    })
    .done(function () { log('Progress auto-saved silently'); })
    .fail(function () { log('Silent save failed (offline?)'); });

  }, 30000);

  /* ─────────────────────────────────────────────
     16. PRICING PLAN SELECTION ($.post simulated)
  ───────────────────────────────────────────── */

  $(document).on('click', '.pricing-btn, .plan-btn', function () {
    const plan = $(this).data('plan') || $(this).closest('.pricing-card').find('h3').text() || 'Pro';
    const $btn = $(this);
    $btn.text('Processing...').prop('disabled', true);

    $.post(`${CONFIG.mockApiBase}/posts`, { plan, timestamp: Date.now() })
      .done(function () {
        showToast(`"${plan}" plan selected! Redirecting to checkout...`, 'success', 3000);
      })
      .fail(function () {
        showToast('Could not process plan. Try again.', 'error');
      })
      .always(function () {
        $btn.text('Get Started').prop('disabled', false);
      });
  });

  /* ─────────────────────────────────────────────
     17. INJECT FOOTER DYNAMIC YEAR
  ───────────────────────────────────────────── */

  $('.footer-year, #footer-year, .copyright-year').text(new Date().getFullYear());
  $('footer').find('p:contains("©")').each(function () {
    $(this).html($(this).html().replace(/\d{4}/, new Date().getFullYear()));
  });

  /* ─────────────────────────────────────────────
     18. EXPORT: expose helpers for script.js
  ───────────────────────────────────────────── */

  window.jqAPI      = API;
  window.jqToast    = showToast;
  window.jqFetchPosts = loadBlogPosts;

  log('✅ jQuery & AJAX module loaded — 30+ events, 6+ AJAX calls ready');
  showToast('InterviewAI ready! 🚀', 'success', 2000);

});