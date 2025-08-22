const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            await requestHandler(req, res, next)
        } catch (error) {
            // Ensure the status code is valid
            let statusCode = 500; // default
            if (typeof error.code === 'number' && error.code >= 100 && error.code < 1000) {
                statusCode = error.code;
            }

            res.status(statusCode).json({
                success: false,
                message: error.message || "Internal Server Error"
            })
        }
    }
}

export { asyncHandler }
