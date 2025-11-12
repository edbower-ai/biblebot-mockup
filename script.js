// Enhanced front-end mock chat behavior
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send');
const clearBtn = document.getElementById('clear');
const convoList = document.getElementById('convo-list');
const toggleThemeBtn = document.getElementById('toggle-theme');
const NEW_CONVO_BTN = document.getElementById('new-convo');

const STORAGE_KEY = 'biblebot_mock_messages';
const THEME_KEY = 'biblebot_theme';

function nowTime() {
  return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}

function appendMessage(text, cls='bot', opts = {}) {
  const el = document.createElement('div');
  el.className = `message ${cls}`;
  // Add content + timestamp
  const textSpan = document.createElement('div');
  textSpan.className = 'message-text';
  textSpan.textContent = text;
  const timeSpan = document.createElement('div');
  timeSpan.className = 'time';
  timeSpan.textContent = nowTime();
  el.appendChild(textSpan);
  el.appendChild(timeSpan);

  messagesEl.appendChild(el);
  // keep focus scroll
  messagesEl.scrollTop = messagesEl.scrollHeight;
  saveMessagesToStorage();
}

// Simulated typing indicator (system message)
function showTypingIndicator(label = 'BibleBot is typing...') {
  const el = document.createElement('div');
  el.className = 'message system typing';
  el.textContent = label;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

// mock reply with small delay
function mockReply(userText){
  const typingEl = showTypingIndicator();
  setTimeout(()=> {
    // remove typing
    typingEl.remove();
    const reply = `Mock answer to: "${userText}". (This is a front-end mockup — replace with real API.)`;
    appendMessage(reply, 'bot');
  }, 850 + Math.min(1200, userText.length * 30));
}

// send handler
function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;
  appendMessage(text, 'user');
  inputEl.value = '';
  autosize(); // readjust height
  mockReply(text);
  inputEl.focus();
}

// Keyboard: Enter sends, Shift+Enter newline
inputEl.addEventListener('keydown', (e)=>{
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Send button
sendBtn.addEventListener('click', sendMessage);

// Clear conversation messages (keep system intro if present)
clearBtn.addEventListener('click', () => {
  // keep first system message if there is one
  const systemIntro = Array.from(messagesEl.querySelectorAll('.message.system'))[0];
  messagesEl.innerHTML = '';
  if (systemIntro) messagesEl.appendChild(systemIntro.cloneNode(true));
  saveMessagesToStorage();
});

// conversation switching (demo)
convoList.addEventListener('click', (e)=>{
  const li = e.target.closest('.convo-item');
  if(!li) return;
  convoList.querySelectorAll('.convo-item').forEach(i=>i.classList.remove('active'));
  li.classList.add('active');
  document.querySelector('.chat-title').textContent = li.textContent;
  messagesEl.innerHTML = '<div class="message system">Loaded "'+li.textContent+'". This is a mock preview of past messages.</div>';
  saveMessagesToStorage();
});

// autosize textarea
function autosize(){
  inputEl.style.height = 'auto';
  inputEl.style.height = (inputEl.scrollHeight) + 'px';
}
inputEl.addEventListener('input', autosize);

// localStorage save/load
function saveMessagesToStorage(){
  try {
    localStorage.setItem(STORAGE_KEY, messagesEl.innerHTML);
  } catch (err) { /* ignore */ }
}
function loadMessagesFromStorage(){
  try {
    const html = localStorage.getItem(STORAGE_KEY);
    if (html) messagesEl.innerHTML = html;
  } catch (err) {}
}

// theme toggle persistence
function setThemeDark(isDark){
  if(isDark) document.body.classList.add('dark');
  else document.body.classList.remove('dark');
  try { localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light'); } catch(e){}
}
toggleThemeBtn.addEventListener('click', ()=>{
  const isDark = document.body.classList.toggle('dark');
  try { localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light'); } catch(e){}
});

// new convo demo
NEW_CONVO_BTN.addEventListener('click', ()=>{
  // simple new convo stub: clear and add a label
  messagesEl.innerHTML = '<div class="message system">New conversation — start chatting.</div>';
  document.querySelectorAll('.convo-item').forEach(i=>i.classList.remove('active'));
  saveMessagesToStorage();
});

// initialize
(function init(){
  // restore theme
  try {
    const t = localStorage.getItem(THEME_KEY);
    setThemeDark(t === 'dark');
  } catch(e){}
  // restore messages
  loadMessagesFromStorage();
  autosize();
})();

