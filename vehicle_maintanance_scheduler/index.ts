import axios from 'axios';


const token_url = 'http://4.224.186.213/evaluation-service/auth';
const vehicles_url = 'http://4.224.186.213/evaluation-service/vehicles';

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

    const response = await axios.post<{ access_token: string }>(token_url, credentials);
    const token = response.data.access_token;
    if (!token) {
        throw new Error('Failed to retrieve access token from response');
    }
    cachedToken = token;
    return token;
}

export async function getTasks(
    time: number,
    score: number

): Promise<any> {

    console.log("tasks list")

    try {
        if (!cachedToken) {
            await getNewToken();
        }

        try {
            const response = await axios.get<any>(vehicles_url, {
                headers: {
                    'Authorization': `Bearer ${cachedToken}`
                }
            });

            // sorted lists 
            // console.log("######")
            // console.log(response.data)
            // console.log("######")

             // Array.prototype.sort(lists, (a, b) => {
            //     if (a.impact / a.duration > b.impact / b.duration) return -1;
            //     if (a.impact / a.duration < b.impact / b.duration) return 1;
            //     return 0;
            // });

            // let final_list = [];
            // // let curr_time = 0;
            // for (i = 0; i < lists.length; i++) {
            //     if (lists[i].Duration <= time && lists[i].Impact >= score) {
            //         final_list.push(lists[i]);
            //         // curr_time += lists[i].Duration;
            //     }
            // }
            // console.log("_____")
            // console.log(final_list.vehicles)
            // console.log("_____")


            const data = response.data;
            const lists = data.vehicles;

            lists.sort((a, b) => {
                const scoreA = (Number(a.impact)) / (Number(a.duration));
                const scoreB = (Number(b.impact)) / (Number(b.duration));
                if (scoreA > scoreB) return -1;
                if (scoreA < scoreB) return 1;
                return 0;
            });

            const final_list = [];

            let curr_time = 0;
            for (let i = 0; i < lists.length; i++) {
                const item = lists[i];
                const duration = Number(item.duration ?? item.Duration ?? 0);
                const impact = Number(item.impact ?? item.Impact ?? 0);
                if (duration <= 0) continue;

                if (impact >= score && curr_time + duration <= time) {
                    final_list.push(item);
                    curr_time += duration;
                }
            }
            console.log("Time: 5\n Score: 8\n")
            console.log("\nSelected Tasks:\n", final_list, "\n");

            return final_list;

        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                await getNewToken();
                const retryResponse = await axios.get<any>(vehicles_url, {
                    headers: {
                        'Authorization': `Bearer ${cachedToken}`
                    }
                });
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



getTasks(5, 8);