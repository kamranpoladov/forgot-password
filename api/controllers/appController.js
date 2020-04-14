module.exports = {
    headerController: (request, response, next) => {
        response.header('Access-Control-Allow-Origin', '*');
        response.header(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        );

        if (request.method === 'OPTIONS') {
            response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            return response
                .status(200)
                .json();
        }

        next();
    },
    pathNotFoundController: (request, response, next) => {
        const error = new Error('Path not found');
        error.status = 404;

        next(error);
    },
    errorResponseController: (error, request, response, next) => {
        response
            .status(error.status || 500)
            .json({
                error: {
                    message: error.message
                }
            });

        return;
    }
};