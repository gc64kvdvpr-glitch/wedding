/* ═══════════════════════════════════════════════
   MOBILE WEDDING INVITATION — SCRIPT
   ═══════════════════════════════════════════════ */

/* ── Supabase Configuration ─────────────────── */
const SUPABASE_URL = 'https://pgrlcwuurllnofoxlseu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncmxjd3V1cmxsbm9mb3hsc2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDQ5OTUsImV4cCI6MjA4ODU4MDk5NX0.nJ8kOhAW0kAISWC2upVclPHwNzydXFvgPJsy_YiiFlI';

let supabaseClient = null;
if (typeof supabase !== 'undefined' && supabase.createClient) {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. Scroll-based fade-in animations ─────── */
  initScrollAnimations();

  /* ── 2. Accordion (account section) ─────────── */
  initAccordion();

  /* ── 3. Copy-to-clipboard ──────────────────── */
  initCopyButtons();

  /* ── 4. Lightbox for gallery ───────────────── */
  initLightbox();

  /* ── 5. Guestbook (Supabase) ───────────────── */
  initGuestbook();
});


/* ═════════════════════════════════════════════════
   1. SCROLL ANIMATIONS
   ═════════════════════════════════════════════════ */
function initScrollAnimations() {
  // Mark sections for fade-in
  const sections = document.querySelectorAll('.section-inner');
  sections.forEach(s => s.classList.add('fade-in'));

  // Story cards (artbook)
  const storyCards = document.querySelectorAll('.story-card[data-aos]');

  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  sections.forEach(s => observer.observe(s));
  storyCards.forEach(c => observer.observe(c));
}


/* ═════════════════════════════════════════════════
   2. ACCORDION
   ═════════════════════════════════════════════════ */
function initAccordion() {
  const headers = document.querySelectorAll('.accordion-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      const isOpen = item.classList.contains('open');

      // Close all others
      document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));

      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });
}


/* ═════════════════════════════════════════════════
   5. COPY TO CLIPBOARD
   ═════════════════════════════════════════════════ */
function initCopyButtons() {
  const buttons = document.querySelectorAll('.copy-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-copy');
      navigator.clipboard.writeText(text).then(() => {
        btn.classList.add('copied');
        btn.textContent = '완료';
        showToast('계좌번호가 복사되었습니다');
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.textContent = '복사';
        }, 2000);
      }).catch(() => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.classList.add('copied');
        btn.textContent = '완료';
        showToast('계좌번호가 복사되었습니다');
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.textContent = '복사';
        }, 2000);
      });
    });
  });
}


/* ═════════════════════════════════════════════════
   6. LIGHTBOX
   ═════════════════════════════════════════════════ */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  if (!lightbox) return;

  // Attach to gallery images (when real images are added)
  document.querySelectorAll('.gallery-item img').forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add('active');
    });
  });

  lightboxClose.addEventListener('click', () => {
    lightbox.classList.remove('active');
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('active');
    }
  });
}


/* ═════════════════════════════════════════════════
   7. GUESTBOOK (Supabase)
   ═════════════════════════════════════════════════ */
let guestbookMessages = [];
let revealedIds = new Set();

function initGuestbook() {
  if (!supabaseClient) {
    console.warn('Supabase 클라이언트를 초기화할 수 없습니다.');
    renderMessages([]);
    return;
  }

  fetchMessages();
  subscribeToMessages();
  initGuestbookForm();
  initPasswordModal();
}

/* Fetch all messages */
async function fetchMessages() {
  try {
    const { data, error } = await supabaseClient
      .from('guestbook')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (data) {
      guestbookMessages = data;
      renderMessages(guestbookMessages);
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
  }
}

/* Realtime subscription */
function subscribeToMessages() {
  supabaseClient
    .channel('public:guestbook')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guestbook' }, (payload) => {
      // Avoid duplicates
      if (!guestbookMessages.find(m => m.id === payload.new.id)) {
        guestbookMessages.unshift(payload.new);
        renderMessages(guestbookMessages);
      }
    })
    .subscribe();
}

/* Render messages */
function renderMessages(messages) {
  const container = document.getElementById('guestbook-messages');
  if (!container) return;

  if (messages.length === 0) {
    container.innerHTML = '<p class="guestbook-empty">첫 번째 축하 메시지를 남겨주세요!</p>';
    return;
  }

  container.innerHTML = messages.map(msg => {
    const isHidden = msg.is_secret && !revealedIds.has(msg.id);
    const dateStr = msg.created_at
      ? new Date(msg.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')
      : '방금 전';

    return `
      <div class="guestbook-card ${isHidden ? 'secret' : ''}" data-msg-id="${msg.id}" ${isHidden ? 'data-secret="true"' : ''}>
        <div class="guestbook-card-header">
          <span class="guestbook-card-name">
            ${escapeHtml(msg.name)}
            ${msg.is_secret ? (isHidden ? '<span class="secret-icon">🔒</span>' : '<span class="secret-icon unlocked">🔓</span>') : ''}
          </span>
          <span class="guestbook-card-date">${dateStr}</span>
        </div>
        <p class="guestbook-card-message ${isHidden ? 'hidden-text' : ''}">
          ${isHidden ? '비밀글입니다. 클릭하여 확인하세요.' : escapeHtml(msg.message)}
        </p>
      </div>
    `;
  }).join('');

  // Attach click handlers for secret messages
  container.querySelectorAll('.guestbook-card[data-secret="true"]').forEach(card => {
    card.addEventListener('click', () => {
      const msgId = card.getAttribute('data-msg-id');
      openPasswordModal(msgId);
    });
  });
}

/* Form submission */
function initGuestbookForm() {
  const form = document.getElementById('guestbook-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('gb-name');
    const passwordInput = document.getElementById('gb-password');
    const messageInput = document.getElementById('gb-message');
    const secretInput = document.getElementById('gb-secret');
    const submitBtn = document.getElementById('gb-submit');

    const name = nameInput.value.trim();
    const password = passwordInput.value.trim();
    const message = messageInput.value.trim();
    const isSecret = secretInput.checked;

    if (!name || !password || !message) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '등록 중... <span class="submit-spinner"></span>';

    try {
      const { error } = await supabaseClient
        .from('guestbook')
        .insert([{ name, password, message, is_secret: isSecret }]);

      if (error) throw error;

      nameInput.value = '';
      passwordInput.value = '';
      messageInput.value = '';
      secretInput.checked = false;
      showToast('축하 메시지가 등록되었습니다 💌');
    } catch (error) {
      console.error('Error posting message:', error);
      showToast('메시지 등록에 실패했습니다.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '등록하기 <span class="submit-arrow">→</span>';
    }
  });
}

/* Password Modal */
let currentPromptMsgId = null;

function initPasswordModal() {
  const modal = document.getElementById('pwd-modal');
  const input = document.getElementById('pwd-modal-input');
  const confirmBtn = document.getElementById('pwd-modal-confirm');
  const cancelBtn = document.getElementById('pwd-modal-cancel');
  const errorEl = document.getElementById('pwd-modal-error');

  if (!modal) return;

  cancelBtn.addEventListener('click', closePasswordModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closePasswordModal();
  });

  confirmBtn.addEventListener('click', () => {
    submitPasswordCheck();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitPasswordCheck();
  });

  input.addEventListener('input', () => {
    errorEl.textContent = '';
    errorEl.classList.remove('show');
  });
}

function openPasswordModal(msgId) {
  currentPromptMsgId = msgId;
  const modal = document.getElementById('pwd-modal');
  const input = document.getElementById('pwd-modal-input');
  const errorEl = document.getElementById('pwd-modal-error');

  input.value = '';
  errorEl.textContent = '';
  errorEl.classList.remove('show');
  modal.classList.add('active');

  setTimeout(() => input.focus(), 100);
}

function closePasswordModal() {
  const modal = document.getElementById('pwd-modal');
  modal.classList.remove('active');
  currentPromptMsgId = null;
}

function submitPasswordCheck() {
  const input = document.getElementById('pwd-modal-input');
  const errorEl = document.getElementById('pwd-modal-error');
  const pwd = input.value;

  const msg = guestbookMessages.find(m => m.id === currentPromptMsgId);
  if (!msg) return;

  if (pwd === msg.password) {
    revealedIds.add(msg.id);
    closePasswordModal();
    renderMessages(guestbookMessages);
  } else {
    errorEl.textContent = '비밀번호가 일치하지 않습니다.';
    errorEl.classList.add('show');
    input.value = '';
    input.focus();
  }
}


/* ═════════════════════════════════════════════════
   UTILITY: Toast notification
   ═════════════════════════════════════════════════ */
function showToast(message) {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

/* UTILITY: Escape HTML */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
