/**
 * @description Standardized API response structure
 */
class ApiResponse<T> {
    statusCode: number;
    success: boolean;
    message: string;
    data: T;

    constructor(statusCode: number, data: T, message = "Success") {
        this.statusCode = statusCode;
        this.success = statusCode < 400;
        this.message = message;
        this.data = data;
    }

    static success<T>(data: T, message = "Success") {
        return new ApiResponse(200, data, message);
    }

    static created<T>(data: T, message = "Created successfully") {
        return new ApiResponse(201, data, message);
    }
}

export default ApiResponse;
