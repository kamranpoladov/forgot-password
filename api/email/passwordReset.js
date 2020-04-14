const nodemailer = require('nodemailer');
const ejs = require('ejs');
const initializeDatabase = require('../database/initialize');
const config = require('../../config.json');
const emailConfig = config['email'];
const emailServer = emailConfig['server'];

function PasswordReset() {
    const transport = nodemailer.createTransport({
        host: emailServer['host'],
        port: emailServer['port'],
        auth: emailServer['credentials']
    });

    const sendEmail = async (receiver, subject, content) => {
        const message = {
            from: emailConfig['account'],
            to: receiver,
            subject: subject,
            html: content
        };

        let emailSendResult;

        try {
            emailSendResult = await transport.sendMail(message);

            if (emailSendResult.rejected.includes(emailReceiver)) {
                logStatus = 'fail';
            } else if (emailSendResult.accepted.includes(emailReceiver)) {
                logStatus = 'success';
            }
        } catch (error) {
            emailSendResult = error;
            logStatus = 'fail';
        }

        const logTimestamp = Date.now();

        return {
            logStatus,
            logTimestamp
        };
    };

    const prepareTemplate = async (templatePath, data) => {
        const content = await ejs.renderFile(templatePath, data, {});

        return content;
    };

    const prepareContent = async (notificationType, emailData) => {
        //EMAIL TEMPLATE
        let templateName, emailSubject;

        if (notificationType === 'update') {
            templateName = 'reset.ejs';
            emailSubject = 'Reset your password — Localhost:3000';
        } else if (notificationType === 'success') {
            templateName = 'resetSuccess.ejs';
            emailSubject = 'Your password has been reset — Localhost:3000';
        }

        const templatePath = __dirname + `/templates/${templateName}`;
        const resetLink = `${emailData.request.headers.host}/reset/${emailData.user.email}/${emailData.token}`;
        const emailContent = await prepareTemplate(templatePath, { link: resetLink });

        return { emailSubject, emailContent, resetLink };
    };

    const updateLogs = async (notificationType, logId, logStatus, logTimestamp) => {
        const database = await initializeDatabase();

        const $set = {
            [`emails.${notificationType}.status`]: logStatus,
            [`emails.${notificationType}.timestamp`]: logTimestamp
        };

        let logUpdateResult;
        try {
            logUpdateResult = await database
                .collection('reset_logs')
                .findOneAndUpdate(
                    { _id: logId },
                    { $set },
                    { returnOriginal: false }
                );
        } catch (error) {
            logUpdateResult = error;
        }

        return logUpdateResult;
    };

    this.resetPasswordNotification = async (notificationType, emailReceiver, emailData, logId) => {
        const { emailSubject, emailContent, resetLink } = await prepareContent(notificationType, emailData);
        const { logStatus, logTimestamp } = await sendEmail(emailReceiver, emailSubject, emailContent);
        const logUpdateResult = await updateLogs(notificationType, logId, logStatus, logTimestamp);

        return {
            resetLink: (logUpdateResult instanceof Error ? 'error' : resetLink)
        };
    };
}

module.exports = PasswordReset;