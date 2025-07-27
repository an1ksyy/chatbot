import { Router } from "express";
import viewsController from "../controllers/views.controller.js";
import fs from "fs";
import path from "node:path";
import session from "express-session";
import bcrypt from "bcrypt";
import Joi from "joi";

export const viewsRouter = Router();

viewsRouter.get('/', viewsController.INDEX);
viewsRouter.get('/login', viewsController.LOGIN);

viewsRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const schema = Joi.object({
        username: Joi.string().min(3).max(32).required(),
        password: Joi.string().min(3).max(128).required()
    });
    const { error } = schema.validate({ username, password });
    if (error) return res.render('login', { error: 'Incorrect username or password' });
    const usersPath = path.join(process.cwd(), 'db', 'users.json');
    let users = [];
    try {
        users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    } catch (e) {}
    const user = users.find(u => u.username === username);
    if (!user) return res.render('login', { error: 'Incorrect username or password' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('login', { error: 'Incorrect username or password' });
    req.session.username = username;
    return res.redirect('/');
});

viewsRouter.get('/register', (req, res) => {
    res.render('register', { error: null });
});

viewsRouter.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const schema = Joi.object({
        username: Joi.string().min(3).max(32).required(),
        password: Joi.string().min(3).max(128).required()
    });
    const { error } = schema.validate({ username, password });
    if (error) return res.render('register', { error: 'Invalid input' });
    const usersPath = path.join(process.cwd(), 'db', 'users.json');
    let users = [];
    try {
        users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    } catch (e) {}
    if (users.find(u => u.username === username)) {
        return res.render('register', { error: 'Username already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    users.push({ username, password: hash });
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    req.session.username = username;
    return res.redirect('/');
});

viewsRouter.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});