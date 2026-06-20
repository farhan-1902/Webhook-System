export interface IStats {
    totalWebhooks: number,
    totalDeliveries: number,
    successfulDeliveries: number,
    failedDeliveries: number,
    failedJobs: number,
    successRate: number,
};

export interface IStatsToday {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
}

export interface ILog {
    status: string;
    webhookId: string;
    eventType: string;
    id: string;
    jobId: string;
    url: string;
    statusCode: number | null;
    attemptNumber: number;
    latency: number;
    timestamp: Date;
}

export interface IPaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface IDeliveryLogs {
    data: ILog[];
    pagination: IPaginationData
}

export interface IWebhooks {
    id: string;
    url: string;
    events: string[];
    secret: string;
    apiKey: string;
    createdAt: Date;
}

export interface IWebhooksData {
    data: IWebhooks[];
    pagination: IPaginationData
}

export interface ILogFilters {
    status: string;
    webhookId: string;
    eventType: string;
}

export interface IFailedJob {
    jobId: string | undefined;
    event: {
        type: string;
        data: any;
        id: string;
        timestamp: string;
        apiKey?: string;
    };
    failedReason: string;
    attemptsMade: number;
    timestamp: number;
}

export interface IFailedJobsData {
    data: IFailedJob[];
}