class apiResponse {
    constructor(statusCode, success, data, message = "success") {
        this.statusCode = statusCode;
        this.success = success;
        this.data = data;
        this.message = message;
    }
}

export { apiResponse };
