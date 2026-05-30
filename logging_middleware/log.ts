import axios from 'axios';
import type { Level, Package, Stack, LogResponse } from './types';

const URL = 'http://4.224.186.213/evaluation-service/logs';
// const TOKEN_URL = 'http://4.224.186.213/evaluation-service/auth';

let cachedToken: string | null = null;

async function getNewToken(): Promise<string> {
    const credentials = {
        email: "2300032849cse2@gmail.com",
        name: "marani sashi warddhan",
        rollNo: "2300032849",
        accessCode: "AvrAAK",
        clientID: "6e2c231a-736a-48a4-aae4-adb43c4f3d36",
        clientSecret: "uvcCxNrxTezTBhhe"
    };

    const response = await axios.post<{ access_token: string }>(URL, credentials);
    const token = response.data.access_token;
    if (!token) {
        throw new Error('Failed to retrieve access token from response');
    }
    cachedToken = token;
    return token;
}

export async function Log(
    stack: Stack,
    level: Level,
    pack: Package,
    message: string
): Promise<LogResponse | { error: string; status: number }> {
    const data = {
        stack,
        level,
        package: pack,
        message
    };

    try {
        if (!cachedToken) {
            await getNewToken();
        }

        try {
            const response = await axios.post<LogResponse>(
                URL,
                data,
                {
                    headers: {
                        'Authorization': `Bearer ${cachedToken}`
                    }
                }
            );
            return response.data;
        } catch (error) {
            
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                await getNewToken();
                const retryResponse = await axios.post<LogResponse>(
                    URL,
                    data,
                    {
                        headers: {
                            'Authorization': `Bearer ${cachedToken}`
                        }
                    }
                );
                return retryResponse.data;
            }
            throw error;
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return {
                error: (error.response?.data as { message?: string })?.message ?? error.message,
                status: error.response?.status ?? 500
            };
        }

        return {
            error: String(error ?? 'failed to capture the log'),
            status: 500
        };
    }
}

