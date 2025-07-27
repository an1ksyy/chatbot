import { Router } from "express";
import viewsController from "../controllers/views.controller.js";
import fs from "fs";
import path from "node:path";
import session from "express-session";

export const viewsRouter = Router();

viewsRouter.get('/', viewsController.INDEX);
viewsRouter.get('/login', viewsController.LOGIN);

viewsRouter.post('/login', (req, res) => {
    const username = req.body.username;
    if (!username) return res.redirect('/login');
    const usersPath = path.join(process.cwd(), 'db', 'users.json');
    let users = [];
    try {
        users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    } catch (e) {}
    if (!users.some(u => u.username === username)) {
        users.push({ username });
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    }
    req.session.username = username;
    res.redirect('/');
});

viewsRouter.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});