import { Log } from '../logging_middleware/log';
import { Level, Package, Stack } from '../logging_middleware/types';

// API Configuration
const BASE_URL = 'http://4.224.186.213/evaluation-service';
const AUTH_URL = `${BASE_URL}/auth`;
const DEPOTS_URL = `${BASE_URL}/depots`;
const VEHICLES_URL = `${BASE_URL}/vehicles`;

// Credentials (aligned with logging_middleware/log.ts)
const CREDENTIALS = {
    email: "2300032849cse2@gmail.com",
    name: "marani sashi warddhan",
    rollNo: "2300032849",
    accessCode: "AvrAAK",
    clientID: "6e2c231a-736a-48a4-aae4-adb43c4f3d36",
    clientSecret: "uvcCxNrxTezTBhhe"
};

// Types
interface RawDepot {
    ID?: number;
    id?: number;
    MechanicHours?: number;
    MechanicalHours?: number;
    mechanicHours?: number;
    mechanicalHours?: number;
}

interface RawVehicle {
    TaskID?: string;
    taskID?: string;
    Duration?: number;
    duration?: number;
    Impact?: number;
    impact?: number;
}

interface Depot {
    id: number;
    capacity: number;
}

interface Vehicle {
    taskID: string;
    duration: number;
    impact: number;
}

interface KnapsackResult {
    selectedVehicles: Vehicle[];
    totalDuration: number;
    totalImpact: number;
}

// Global state for auth
let cachedToken: string | null = null;

/**
 * Retrives a Bearer Auth Token using the hardcoded credentials.
 */
async function getAuthToken(): Promise<string> {
    if (cachedToken) return cachedToken;

    console.log('\x1b[36m[Auth]\x1b[0m Requesting authorization token...');
    const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(CREDENTIALS)
    });

    if (!response.ok) {
        throw new Error(`Authentication failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as { access_token: string };
    if (!data.access_token) {
        throw new Error('Access token not found in authentication response');
    }

    cachedToken = data.access_token;
    return cachedToken;
}

/**
 * Fetches data from a given URL with Bearer authentication.
 */
async function authenticatedFetch<T>(url: string): Promise<T> {
    const token = await getAuthToken();
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    if (response.status === 401) {
        // Token might have expired, try resetting and fetching again once
        cachedToken = null;
        const newToken = await getAuthToken();
        const retryResponse = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${newToken}`,
                'Accept': 'application/json'
            }
        });
        if (!retryResponse.ok) {
            throw new Error(`Request failed after token refresh: ${retryResponse.statusText}`);
        }
        return await retryResponse.json() as T;
    }

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
    }

    return await response.json() as T;
}

/**
 * Custom 0-1 Knapsack Solver using Dynamic Programming.
 * Maximizes impact while keeping the total duration under or equal to capacity.
 */
function solveKnapsack(capacity: number, vehicles: Vehicle[]): KnapsackResult {
    const n = vehicles.length;
    // DP array of size (n + 1) x (capacity + 1)
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        const vehicle = vehicles[i - 1];
        const w = vehicle.duration;
        const v = vehicle.impact;

        for (let j = 0; j <= capacity; j++) {
            if (w <= j) {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i - 1][j - w] + v);
            } else {
                dp[i][j] = dp[i - 1][j];
            }
        }
    }

    // Backtrack to reconstruct the optimal set of vehicles
    const selected: Vehicle[] = [];
    let remainingCapacity = capacity;
    for (let i = n; i > 0; i--) {
        if (dp[i][remainingCapacity] !== dp[i - 1][remainingCapacity]) {
            const vehicle = vehicles[i - 1];
            selected.push(vehicle);
            remainingCapacity -= vehicle.duration;
        }
    }

    return {
        selectedVehicles: selected.reverse(),
        totalDuration: capacity - remainingCapacity,
        totalImpact: dp[n][capacity]
    };
}

/**
 * Main execution flow.
 */
async function main() {
    console.log('\x1b[35m============================================================\x1b[0m');
    console.log('\x1b[35m       AFFORDMED VEHICLE MAINTENANCE SCHEDULER SYSTEM        \x1b[0m');
    console.log('\x1b[35m============================================================\x1b[0m\n');

    try {
        // Step 1: Log initialization to our middleware
        await Log(
            Stack.backend,
            Level.info,
            Package.service,
            'Vehicle Maintenance Scheduler service initialized and started.'
        );

        // Step 2: Fetch raw depots and vehicles
        console.log('\x1b[34m[Data Ingestion]\x1b[0m Fetching depots and vehicles data from API...');
        
        const rawDepotResponse = await authenticatedFetch<{ depots: RawDepot[] }>(DEPOTS_URL);
        const rawVehicleResponse = await authenticatedFetch<{ vehicles: RawVehicle[] }>(VEHICLES_URL);

        // Step 3: Parse and Normalize Data robustly
        const depots: Depot[] = (rawDepotResponse.depots || []).map(d => ({
            id: d.ID ?? d.id ?? 0,
            capacity: d.MechanicHours ?? d.MechanicalHours ?? d.mechanicHours ?? d.mechanicalHours ?? 0
        })).sort((a, b) => a.id - b.id);

        const vehicles: Vehicle[] = (rawVehicleResponse.vehicles || []).map(v => ({
            taskID: v.TaskID ?? v.taskID ?? "",
            duration: v.Duration ?? v.duration ?? 0,
            impact: v.Impact ?? v.impact ?? 0
        }));

        console.log(`\x1b[32m[Success]\x1b[0m Ingested ${depots.length} depots and ${vehicles.length} vehicles.\n`);

        console.log('\x1b[36m============================================================\x1b[0m');
        console.log('\x1b[36m                   DEPOT SUMMARY & BUDGETS                  \x1b[0m');
        console.log('\x1b[36m============================================================\x1b[0m');
        console.log('| Depot ID | Available Mechanic Hours |');
        console.log('|----------|--------------------------|');
        depots.forEach(d => {
            console.log(`|    ${d.id.toString().padEnd(5)} | ${d.capacity.toString().padEnd(24)} |`);
        });
        console.log('============================================================\n');

        // Step 4: Run Knapsack optimization for each depot
        console.log('\x1b[34m[Optimization]\x1b[0m Executing 0-1 Knapsack Solver for each depot...\n');
        
        const results: { depot: Depot; schedule: KnapsackResult }[] = [];
        let totalSystemImpact = 0;
        let totalSystemScheduledHours = 0;

        for (const depot of depots) {
            const schedule = solveKnapsack(depot.capacity, vehicles);
            results.push({ depot, schedule });
            totalSystemImpact += schedule.totalImpact;
            totalSystemScheduledHours += schedule.totalDuration;

            // Log each depot schedule resolution
            await Log(
                Stack.backend,
                Level.info,
                Package.service,
                `Depot ${depot.id} resolved: Selected ${schedule.selectedVehicles.length} vehicles, Total Duration: ${schedule.totalDuration}/${depot.capacity} hrs, Total Impact: ${schedule.totalImpact}`
            );
        }

        // Step 5: Output Dashboard
        console.log('\x1b[32m=========================================================================\x1b[0m');
        console.log('\x1b[32m                  OPTIMAL VEHICLE MAINTENANCE SCHEDULES                  \x1b[0m');
        console.log('\x1b[32m=========================================================================\x1b[0m');
        
        for (const { depot, schedule } of results) {
            console.log(`\n\x1b[33m▶ DEPOT #${depot.id} (Capacity: ${depot.capacity} hrs) [Impact Achieved: ${schedule.totalImpact}]\x1b[0m`);
            console.log('-------------------------------------------------------------------------');
            console.log(`| ${'Task ID'.padEnd(38)} | ${'Duration (hrs)'.padEnd(14)} | ${'Impact Score'.padEnd(12)} |`);
            console.log('-------------------------------------------------------------------------');
            
            if (schedule.selectedVehicles.length === 0) {
                console.log(`| ${'No vehicles scheduled (budget too low)'.padEnd(70)} |`);
            } else {
                schedule.selectedVehicles.forEach(v => {
                    console.log(`| ${v.taskID.padEnd(38)} | ${v.duration.toString().padStart(14)} | ${v.impact.toString().padStart(12)} |`);
                });
            }
            console.log('-------------------------------------------------------------------------');
            console.log(`| ${'TOTAL SCHEDULED'.padEnd(38)} | ${(`${schedule.totalDuration}/${depot.capacity} hrs`).padStart(14)} | ${schedule.totalImpact.toString().padStart(12)} |`);
            console.log('-------------------------------------------------------------------------\n');
        }

        // Print final overall statistics
        console.log('\x1b[35m=========================================================================\x1b[0m');
        console.log('\x1b[35m                        OVERALL SYSTEM METRICS                          \x1b[0m');
        console.log('\x1b[35m=========================================================================\x1b[0m');
        console.log(`Total Depots Processed : ${depots.length}`);
        console.log(`Total Vehicles Pool    : ${vehicles.length}`);
        console.log(`Total Scheduled Hours  : ${totalSystemScheduledHours} hours`);
        console.log(`Total Maximized Impact : ${totalSystemImpact}`);
        console.log('=========================================================================\n');

        // Log overall success
        await Log(
            Stack.backend,
            Level.info,
            Package.service,
            `Overall scheduling completed successfully. Total System Impact: ${totalSystemImpact}, Scheduled Hours: ${totalSystemScheduledHours}`
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`\x1b[31m[Error]\x1b[0m Failure during scheduler execution:`, errorMessage);
        
        await Log(
            Stack.backend,
            Level.error,
            Package.service,
            `Vehicle Maintenance Scheduler encountered a fatal error: ${errorMessage}`
        );
    }
}

main();
