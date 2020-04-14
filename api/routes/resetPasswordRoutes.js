const crypto = require('crypto');
const router = require('express').Router();
const config = require('../../config.json');
const initializeDatabase = require('../database/initialize');
const PasswordReset = require('../email/passwordReset');

const updateUsersCollection = async (database, filter, update) => {
    const updatedUser = await database
        .collection('users')
        .findOneAndUpdate(
            filter,
            update,
            { returnNewDocument: true }
        );

    if (!updatedUser.value) {
        const error = {
            message: `No user found with email ${email} in the database`,
            status: 404
        };

        throw error;
    }

    return updatedUser.value;
};

// request.body demands user email only
router.post('/', async (request, response) => {
    const database = await initializeDatabase();

    const bytes = 20;
    const buffer = crypto.randomBytes(bytes);
    const token = buffer.toString('hex');

    //TODO: ADD EMAIL VERIFICATION
    const email = request.body.email;
    const tokenExpirationTime = config['encryption']['token_expiration_time'];

    try {
        const update = {
            $push: {
                tokens: {
                    body: token,
                    expiresAt: Date.now() + tokenExpirationTime
                }
            }
        };

        const updatedUser = await updateUsersCollection(database, { email }, update);

        const log = await database
            .collection('reset_logs')
            .insertOne({
                userId: updatedUser._id,
                token,
                emails: {
                    update: {},
                    success: {}
                }
            });

        const passwordReset = new PasswordReset();
        const notificationResult = await passwordReset.resetPasswordNotification(
            'update',
            email,
            {
                user: updatedUser,
                request,
                token
            },
            log.insertedId
        );

        response
            .status(200)
            .json(notificationResult);
    } catch (error) {
        console.log(error);
        response
            .status(error.status || 404)
            .json(error);
    }
});

// Change the password via post request form
// request.body demands new password only
router.post('/:email/:token', async (request, response) => {
    const database = await initializeDatabase();

    const email = request.params.email;
    const token = request.params.token;
    const password = request.body.password;

    //TOKEN TIME VERIFICATION
    const tokenDocument = await database
        .collection('users')
        .findOne({ tokens: { token } });

    if (Date.now() < tokenDocument.expiresAt) {
        try {
            const update = {
                $pull: { tokens: { body: token } },
                $set: { password }
            };

            const updatedUser = await updateUsersCollection(database, { email }, update);

            const log = await database
                .collection('reset_logs')
                .findOne({ token });

            const passwordReset = new PasswordReset();
            const notificationResult = await passwordReset.resetPasswordNotification(
                'success',
                email,
                {},
                log._id
            );

            response
                .status(200)
                .json(notificationResult);
        } catch (error) {
            console.log(error);
            response
                .status(error.status)
                .json(error);
        }
    } else {
        response
            .status(403)
            .json({ message: 'token is expired' });
    }
});

module.exports = router;