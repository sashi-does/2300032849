export enum Stack {
    backend = "backend",
    frontend = "frontend"
};

export enum Level {
    debug = "debug",
    info = "info",
    warn = "warn",
    error = "error",
    fatal = "fatal"
};

export enum Package {
    cache = "cache",
    controller = "controller",
    cron_job = "cron_job",
    db = "db",
    domain = "domain",
    handler = "handler",
    repository = "repository",
    route = "route",
    service = "service"
}

export interface LogResponse {
    logId: string;
    message: string;
    status?: number;
};