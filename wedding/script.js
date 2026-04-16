/* ═══════════════════════════════════════════════
   WEDDING ANNOUNCEMENT — SCRIPT (v2 minimal)
   ═══════════════════════════════════════════════ */

/* ── Supabase Configuration ─────────────────── */
const SUPABASE_URL = 'https://pgrlcwuurllnofoxlseu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncmxjd3V1cmxsbm9mb3hsc2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDQ5OTUsImV4cCI6MjA4ODU4MDk5NX0.nJ8kOhAW0kAISWC2upVclPHwNzydXFvgPJsy_YiiFlI';

let supabaseClient = null;
if (typeof supabase !== 'undefined' && supabase.createClient) {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initAccordion();
  initCopyButtons();
  initGuestbook();
  checkGiftVisibility();
});

function checkGiftVisibility() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('gift') === 'no') {
    const accountSection = document.getElementById('account');
    const accountDivider = document.getElementById('account-divider');
    if (accountSection) accountSection.style.display = 'none';
    if (accountDivider) accountDivider.style.display = 'none';
  }
}


/* ═════════════════════════════════════════════════
   1. SCROLL ANIMATIONS
   ═════════════════════════════════════════════════ */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.section-inner, .section-label, .section-title, [data-aos], .family-card, .guestbook-form, .guestbook-card, .accordion-item').forEach(el => {
    el.classList.add('fade-up');
    observer.observe(el);
  });
}


/* ═════════════════════════════════════════════════
   2. ACCORDION
   ═════════════════════════════════════════════════ */
function initAccordion() {
  const headers = document.querySelectorAll('.accordion-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const targetId = header.getAttribute('data-target');
      const body = document.getElementById(targetId);
      const arrow = header.querySelector('.accordion-arrow');
      const isOpen = body.classList.contains('open');

      // Close all
      document.querySelectorAll('.accordion-body').forEach(b => b.classList.remove('open'));
      document.querySelectorAll('.accordion-arrow').forEach(a => { a.style.transform = 'rotate(0deg)'; });

      if (!isOpen) {
        body.classList.add('open');
        arrow.style.transform = 'rotate(180deg)';
      }
    });
  });
}


/* ═════════════════════════════════════════════════
   3. COPY TO CLIPBOARD
   ═════════════════════════════════════════════════ */
function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
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
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('계좌번호가 복사되었습니다');
      });
    });
  });
}


/* ═════════════════════════════════════════════════
   4. GUESTBOOK (Supabase) — with Edit & Delete
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

/* Realtime subscription — INSERT, UPDATE, DELETE */
function subscribeToMessages() {
  supabaseClient
    .channel('public:guestbook')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guestbook' }, (payload) => {
      if (!guestbookMessages.find(m => m.id === payload.new.id)) {
        guestbookMessages.unshift(payload.new);
        renderMessages(guestbookMessages);
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'guestbook' }, (payload) => {
      const idx = guestbookMessages.findIndex(m => m.id === payload.new.id);
      if (idx !== -1) {
        guestbookMessages[idx] = payload.new;
        renderMessages(guestbookMessages);
      }
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'guestbook' }, (payload) => {
      guestbookMessages = guestbookMessages.filter(m => m.id !== payload.old.id);
      renderMessages(guestbookMessages);
    })
    .subscribe();
}

/* Pagination state */
const MESSAGES_PER_PAGE = 5;
let currentPage = 1;

/* Render messages with pagination */
function renderMessages(messages) {
  const container = document.getElementById('guestbook-messages');
  const paginationEl = document.getElementById('guestbook-pagination');
  if (!container) return;

  if (messages.length === 0) {
    container.innerHTML = '<p class="guestbook-empty">첫 번째 축하 메시지를 남겨주세요!</p>';
    if (paginationEl) paginationEl.innerHTML = '';
    return;
  }

  const totalPages = Math.ceil(messages.length / MESSAGES_PER_PAGE);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const start = (currentPage - 1) * MESSAGES_PER_PAGE;
  const end = start + MESSAGES_PER_PAGE;
  const pageMessages = messages.slice(start, end);

  container.innerHTML = pageMessages.map(msg => {
    const isHidden = msg.is_secret && !revealedIds.has(msg.id);
    let dateStr = '방금 전';
    if (msg.created_at) {
      const d = new Date(msg.created_at);
      dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    }

    return `
      <div class="guestbook-card ${isHidden ? 'secret' : ''}" data-msg-id="${msg.id}">
        <div class="guestbook-card-header">
          <span class="guestbook-card-name">
            ${escapeHtml(msg.name)} <span class="guestbook-card-date-inline">${dateStr}</span>
            ${msg.is_secret ? (isHidden ? '<span class="secret-icon">🔒</span>' : '<span class="secret-icon unlocked">🔓</span>') : ''}
          </span>
          <div class="guestbook-card-actions">
            <button class="gb-action-btn gb-edit-btn" data-action="edit" data-id="${msg.id}" title="수정">✎</button>
            <button class="gb-action-btn gb-delete-btn" data-action="delete" data-id="${msg.id}" title="삭제">✕</button>
          </div>
        </div>
        <p class="guestbook-card-message ${isHidden ? 'hidden-text' : ''}" ${isHidden ? 'data-secret="true"' : ''}>
          ${isHidden ? '비밀글입니다. 클릭하여 확인하세요.' : escapeHtml(msg.message)}
        </p>
      </div>
    `;
  }).join('');

  // Secret message click handler
  container.querySelectorAll('.guestbook-card-message[data-secret="true"]').forEach(el => {
    el.addEventListener('click', () => {
      const msgId = el.closest('.guestbook-card').getAttribute('data-msg-id');
      openPasswordModal(msgId, 'reveal');
    });
  });

  // Edit/Delete button handlers
  container.querySelectorAll('.gb-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      openPasswordModal(id, action);
    });
  });

  // Render pagination
  renderPagination(totalPages);
}

/* Pagination buttons */
function renderPagination(totalPages) {
  const paginationEl = document.getElementById('guestbook-pagination');
  if (!paginationEl || totalPages <= 1) {
    if (paginationEl) paginationEl.innerHTML = '';
    return;
  }

  let html = '';

  // Previous arrow
  html += `<button class="gb-page-btn gb-page-arrow" ${currentPage <= 1 ? 'disabled' : ''} data-page="${currentPage - 1}">‹</button>`;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="gb-page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  // Next arrow
  html += `<button class="gb-page-btn gb-page-arrow" ${currentPage >= totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">›</button>`;

  paginationEl.innerHTML = html;

  // Click handlers
  paginationEl.querySelectorAll('.gb-page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.getAttribute('data-page'));
      if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderMessages(guestbookMessages);
        // Scroll to guestbook top
        document.getElementById('guestbook')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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
      const { data, error } = await supabaseClient
        .from('guestbook')
        .insert([{ name, password, message, is_secret: isSecret }])
        .select();

      if (error) throw error;

      // Immediately add to local list (in case realtime is slow)
      if (data && data[0] && !guestbookMessages.find(m => m.id === data[0].id)) {
        guestbookMessages.unshift(data[0]);
        renderMessages(guestbookMessages);
      }

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

/* Password Modal — supports reveal / edit / delete */
let currentPromptMsgId = null;
let currentPromptAction = 'reveal'; // 'reveal' | 'edit' | 'delete'

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
    if (e.key === 'Enter') {
      const editMsg = document.getElementById('pwd-modal-edit-msg');
      if (editMsg && editMsg.style.display !== 'none') return; // allow Enter in textarea
      submitPasswordCheck();
    }
  });

  input.addEventListener('input', () => {
    errorEl.textContent = '';
    errorEl.classList.remove('show');
  });
}

function openPasswordModal(msgId, action = 'reveal') {
  currentPromptMsgId = msgId;
  currentPromptAction = action;

  const modal = document.getElementById('pwd-modal');
  const input = document.getElementById('pwd-modal-input');
  const errorEl = document.getElementById('pwd-modal-error');
  const titleEl = document.getElementById('pwd-modal-title');
  const descEl = document.getElementById('pwd-modal-desc');
  const editMsg = document.getElementById('pwd-modal-edit-msg');
  const confirmBtn = document.getElementById('pwd-modal-confirm');

  input.value = '';
  errorEl.textContent = '';
  errorEl.classList.remove('show');
  editMsg.style.display = 'none';
  editMsg.value = '';

  if (action === 'edit') {
    titleEl.textContent = '메시지 수정';
    descEl.innerHTML = '비밀번호를 입력한 후<br/>메시지를 수정해주세요.';
    confirmBtn.textContent = '수정';
  } else if (action === 'delete') {
    titleEl.textContent = '메시지 삭제';
    descEl.innerHTML = '삭제하려면 비밀번호를<br/>입력해주세요.';
    confirmBtn.textContent = '삭제';
  } else {
    titleEl.textContent = '비밀번호 입력';
    descEl.innerHTML = '작성 시 설정한 비밀번호를<br/>입력해주세요.';
    confirmBtn.textContent = '확인';
  }

  modal.classList.add('active');
  setTimeout(() => input.focus(), 100);
}

function closePasswordModal() {
  const modal = document.getElementById('pwd-modal');
  modal.classList.remove('active');
  currentPromptMsgId = null;
  currentPromptAction = 'reveal';
}

async function submitPasswordCheck() {
  const input = document.getElementById('pwd-modal-input');
  const errorEl = document.getElementById('pwd-modal-error');
  const editMsg = document.getElementById('pwd-modal-edit-msg');
  const pwd = input.value;

  if (!pwd) {
    errorEl.textContent = '비밀번호를 입력해주세요.';
    errorEl.classList.add('show');
    return;
  }

  const msg = guestbookMessages.find(m => m.id == currentPromptMsgId);
  if (!msg) return;

  if (pwd !== msg.password) {
    errorEl.textContent = '비밀번호가 일치하지 않습니다.';
    errorEl.classList.add('show');
    input.value = '';
    input.focus();
    return;
  }

  // --- PASSWORD CORRECT ---
  if (currentPromptAction === 'reveal') {
    revealedIds.add(msg.id);
    closePasswordModal();
    renderMessages(guestbookMessages);

  } else if (currentPromptAction === 'edit') {
    // First time: show the edit textarea
    if (editMsg.style.display === 'none') {
      editMsg.style.display = 'block';
      editMsg.value = msg.message;
      input.disabled = true;
      editMsg.focus();
      return; // Don't close yet, wait for second submit
    }

    // Second time: save the edit
    const newMessage = editMsg.value.trim();
    if (!newMessage) {
      errorEl.textContent = '메시지를 입력해주세요.';
      errorEl.classList.add('show');
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('guestbook')
        .update({ message: newMessage })
        .eq('id', msg.id);

      if (error) throw error;

      // Update locally immediately
      msg.message = newMessage;
      renderMessages(guestbookMessages);
      closePasswordModal();
      showToast('메시지가 수정되었습니다 ✏️');
    } catch (error) {
      console.error('Error updating message:', error);
      showToast('수정에 실패했습니다.');
    }

  } else if (currentPromptAction === 'delete') {
    try {
      const { error } = await supabaseClient
        .from('guestbook')
        .delete()
        .eq('id', msg.id);

      if (error) throw error;

      // Remove locally immediately
      guestbookMessages = guestbookMessages.filter(m => m.id !== msg.id);
      renderMessages(guestbookMessages);
      closePasswordModal();
      showToast('메시지가 삭제되었습니다 🗑️');
    } catch (error) {
      console.error('Error deleting message:', error);
      showToast('삭제에 실패했습니다.');
    }
  }
}


/* ═════════════════════════════════════════════════
   UTILITY: Toast notification
   ═════════════════════════════════════════════════ */
function showToast(message) {
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
