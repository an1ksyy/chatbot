import fs from "fs";
import path from "node:path";

export default {
    INDEX: (req, res) => {
        if (!req.session.username) return res.redirect('/login');
        const usersPath = path.join(process.cwd(), 'db', 'users.json');
        let users = [];
        try {
            users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
        } catch (e) {}
        const filteredUsers = users.filter(u => u.username !== req.session.username);
        return res.render('index', { username: req.session.username, users: filteredUsers });
    },
    LOGIN: (req, res) => {
        return res.render('login');
    }
}