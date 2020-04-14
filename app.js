const express = require('express');
const app = express();

const resetPasswordRoutes = require('./api/routes/resetPasswordRoutes');

const {
    headerController,
    pathNotFoundController,
    errorResponseController
} = require('./api/controllers/appController');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(headerController);
app.use('/reset', resetPasswordRoutes);

app.use(pathNotFoundController);
app.use(errorResponseController);

module.exports = app;