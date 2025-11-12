// small front-end-only mock chat behavior
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send');
const clearBtn = document.getElementById('clear');
const convoList = document.getElementById('convo-list');

function appendMessage(text, cls='bot'){
  const el = document.createElement('div');
  el.className = `message ${cls}`;
  el.textContent = text;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// simple simulated reply
function mockReply(userText){
  const reply = `Mock answer to: "${userText}". (This is a front-end mockup — replace with real API.)`;
  setTimeout(()=> appendMessage(reply, 'bot'), 600);
}

// send event
sendBtn.addEventListener('click', () => {
  const text = inputEl.value.trim();
  if(!text) return;
  appendMessage(text, 'user');
  inputEl.value = '';
  mockReply(text);
});

// clear conversation messages (except system)
clearBtn.addEventListener('click', () => {
  // keep system message
  messagesEl.querySelectorAll('.message').forEach(m=>{
    if(!m.classList.contains('system')) m.remove();
  });
});

// conversation switching (demo)
convoList.addEventListener('click', (e)=>{
  const li = e.target.closest('.convo-item');
  if(!li) return;
  // visually active
  convoList.querySelectorAll('.convo-item').forEach(i=>i.classList.remove('active'));
  li.classList.add('active');
  // replace header title & reset messages (demo)
  document.querySelector('.chat-title').textContent = li.textContent;
  // demo: load a short stub
  messagesEl.innerHTML = '<div class="message system">Loaded "'+li.textContent+'". This is a mock preview of past messages.</div>';
});

