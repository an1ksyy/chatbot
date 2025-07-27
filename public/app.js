const socket = io();

const username = document.querySelector('div.text-lg.font-bold').textContent;
let currentChatUser = null;
let messages = {}; 

const chatArea = document.getElementById('chat-area');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const userBtns = document.querySelectorAll('.user-btn');
const chatHeader = document.getElementById('chat-header');
const chatHeaderAvatar = document.getElementById('chat-header-avatar');
const chatHeaderUsername = document.getElementById('chat-header-username');
const chatHeaderStatus = document.getElementById('chat-header-status');

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderMessages(withUser) {
  chatArea.innerHTML = '';
  (messages[withUser] || []).forEach(msg => {
    const align = msg.from === username ? 'justify-end' : 'justify-start';
    const bubbleColor = msg.from === username ? 'bg-[#1e88e5] rounded-2xl rounded-br-none' : 'bg-[#22336b] rounded-2xl rounded-bl-none';
    const time = msg.time ? `<span class='ml-2 text-xs text-[#eeeeeeaf]'>${formatTime(msg.time)}</span>` : '';
    const div = document.createElement('div');
    div.className = `flex ${align} mb-2`;
    div.innerHTML = `<div class="${bubbleColor} px-4 py-2 max-w-[70%] text-sm shadow flex items-end">${msg.text}${time}</div>`;
    chatArea.appendChild(div);
  });
  chatArea.scrollTop = chatArea.scrollHeight;
}

userBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentChatUser = btn.dataset.username;
    chatHeaderAvatar.classList.remove('hidden');
    chatHeaderAvatar.textContent = currentChatUser[0].toUpperCase();
    chatHeaderUsername.textContent = currentChatUser;
    chatHeaderStatus.textContent = 'online';
    socket.emit('fetch_history', { withUser: currentChatUser });
    userBtns.forEach(b => b.classList.remove('bg-[#1e88e5]', 'text-white'));
    btn.classList.add('bg-[#1e88e5]', 'text-white');
  });
});

chatForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!currentChatUser || !chatInput.value.trim()) return;
  const msg = { from: username, to: currentChatUser, text: chatInput.value, time: Date.now() };
  socket.emit('private_message', msg);
  chatInput.value = '';
});

socket.on('private_message', msg => {
  const other = msg.from === username ? msg.to : msg.from;
  if (!messages[other]) messages[other] = [];
  messages[other].push(msg);
  if (currentChatUser === other) renderMessages(other);
});

socket.on('chat_history', ({ withUser, messages: msgs }) => {
  messages[withUser] = msgs;
  if (currentChatUser === withUser) renderMessages(withUser);
});

console.log('Client JS loaded');