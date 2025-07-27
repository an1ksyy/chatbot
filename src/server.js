import express from "express"
import path from "node:path"
import { util } from "./utils/config.js"
import { viewsRouter } from "./routes/views.routes.js"
import { Server } from "socket.io"
import http from "node:http"
import session from "express-session"
import fs from "fs"

const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer)

app.use(express.urlencoded({ extended: true }))
const sessionMiddleware = session({ secret: 'telegram_secret', resave: false, saveUninitialized: true })
app.use(sessionMiddleware)

app.set('view engine', 'ejs')
app.set('views', path.join(process.cwd(), 'src', 'views'))
app.use(viewsRouter)
app.use(express.static(path.join(process.cwd(), 'public')))

// Share session with Socket.io
import { parse } from 'cookie';
io.use((socket, next) => {
    const cookie = socket.request.headers.cookie;
    if (!cookie) return next();
    const cookies = parse(cookie);
    const sid = cookies['connect.sid'];
    if (!sid) return next();
    sessionMiddleware(socket.request, {}, next);
});

// Track users: { username: socket.id }
const userSockets = {};

const messagesPath = path.join(process.cwd(), 'db', 'messages.json');
function loadMessages() {
    try {
        return JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    } catch (e) {
        return [];
    }
}
function saveMessage(msg) {
    const messages = loadMessages();
    messages.push(msg);
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));
}

io.on('connection', (socket) => {
    const req = socket.request;
    const username = req.session?.username;
    if (!username) return;
    userSockets[username] = socket.id;

    // Fetch chat history between two users
    socket.on('fetch_history', ({ withUser }) => {
        const messages = loadMessages().filter(m =>
            (m.from === username && m.to === withUser) ||
            (m.from === withUser && m.to === username)
        );
        socket.emit('chat_history', { withUser, messages });
    });

    socket.on('private_message', (msg) => {
        saveMessage(msg);
        const toSocketId = userSockets[msg.to];
        if (toSocketId) {
            io.to(toSocketId).emit('private_message', msg);
        }
        // Also echo to sender for consistency
        socket.emit('private_message', msg);
    });
    socket.on('disconnect', () => {
        delete userSockets[username];
    });
});

httpServer.listen(util.PORT, () => console.log(`Server is listening on port: ${util.PORT}`))