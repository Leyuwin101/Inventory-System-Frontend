const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

/**
 * Retrieves the stored access token.
 *
 * @returns {string | null} JWT access token
 */
export const getToken = () => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}


/**
 * Stores both access and refresh tokens in localStorage.
 *
 * @param {string} accessToken JWT access token
 * @param {string} refreshToken JWT refresh token
 */
export const setTokens = (accessToken, refreshToken) => {
    if (!accessToken) {
        throw new Error("Cannot store missing access token");
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
}

/**
 * Retrieves the stored refresh token.
 *
 * @returns {string | null} JWT refresh token
 */
export const getRefreshToken = () => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
};


/**
 * Clears all authentication tokens from storage.
 *
 * Used during logout or session expiration.
 */
export const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};
