import axios from "axios";

const API_URL = "http://4.224.186.213/evaluation-service/notifications";
const TOKEN_URL = "http://4.224.186.213/evaluation-service/auth";
const DEFAULT_TOP = 10;

type Credentials = {
  email: string;
  name: string;
  rollNo: string;
  accessCode: string;
  clientID: string;
  clientSecret: string;
};

const credentials: Credentials = {
  email: "2300032849cse2@gmail.com",
  name: "marani sashi warddhan",
  rollNo: "2300032849",
  accessCode: "AvrAAK",
  clientID: "6e2c231a-736a-48a4-aae4-adb43c4f3d36",
  clientSecret: "uvcCxNrxTezTBhhe",
};

async function getToken(): Promise<string> {
  const resp = await axios.post(TOKEN_URL, credentials);
  return resp.data?.access_token;
}


// weights assumption
function priorityWeight(type: string) {
  if (type === "Placement") return 3;
  if (type === "Result") return 2;
  if (type === "Event") return 1;
  return 0;
}

function sortNotifications(items: any[]) {
  return items.slice().sort((a, b) => {
    const weightA = priorityWeight(a.Type);
    const weightB = priorityWeight(b.Type);
    // weights not equal 
    if (weightA !== weightB) {
        if(weightA > weightB) return weightA;
        return weightB;
    }
    // first come first serve
    if(a.Timestamp > b.Timestamp) return b;
        return a;
  });
}

async function fetchNotifications() {
  const token = await getToken();
  const resp = await axios.get(API_URL, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return Array.isArray(resp.data?.notifications) ? resp.data.notifications : [];
}


const notifications = await fetchNotifications();

// considering the first 10 notifications
const inbox = sortNotifications(notifications).slice(DEFAULT_TOP);

for( let i = 0; i < inbox.length; i++) {
    console.log(inbox[i]);
}



