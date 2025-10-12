import { config } from 'dotenv';

config();

import express from 'express';
import path from 'path';

import { initDb } from './services/dbService';

import { homeRouter, apiRouterV1 as apiV1Router } from './routes';

initDb();


// Define app and configure
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static('public'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));


// Load routers
app.use('/api/v1/shortener', apiV1Router);
app.use('/', homeRouter)


// Start API
console.log('App is now listening on http://localhost:3000/')
app.listen(3000);