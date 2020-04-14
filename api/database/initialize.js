const MongoClient = require('mongodb').MongoClient;
const config = require('../../config.json');

const init = async () => {
    const connectionString = config['mongo']['connection_string'];
    const databaseName = config['mongo']['database_name'];
    const connectionSettings = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    };

    let mongoClient;

    try {
        mongoClient = await MongoClient.connect(connectionString, connectionSettings);
        const database = mongoClient.db(databaseName);

        return database;
    } catch (error) {
        error.customMessage = 'Unable to connect to MongoDB';
        console.log(error);
    }
};

module.exports = init;