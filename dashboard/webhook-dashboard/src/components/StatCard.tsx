import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { IStats } from "../data/Interfaces.i";
import "./../App.css";


function StatCard() {
    const stats = useQuery<IStats>({
        queryKey: ["stats"],
        queryFn: fetchStats,
        retry: 5,
        refetchInterval: 5000
    });

    const fallbackValue: string = "Not found";

    return (
        <div className="home-card">
            <div className="home-card-header">
                <p className="home-card-title">Overall Statistics</p>
            </div>
            <div className="home-card-grid">
                <div className="home-card-item">
                    <span className="label">Total webhooks</span>
                    <span className="value">{stats.data?.totalWebhooks ?? fallbackValue}</span>
                </div>
                <div className="home-card-item">
                    <span className="label">Total deliveries</span>
                    <span className="value">{stats.data?.totalDeliveries ?? fallbackValue}</span>
                </div>
                <div className="home-card-item">
                    <span className="label">Successful deliveries</span>
                    <span className="value">{stats.data?.successfulDeliveries ?? fallbackValue}</span>
                </div>
                <div className="home-card-item">
                    <span className="label">Failed deliveries</span>
                    <span className="value">{stats.data?.failedDeliveries ?? fallbackValue}</span>
                </div>
                <div className="home-card-item">
                    <span className="label">Failed jobs</span>
                    <span className="value">{stats.data?.failedJobs ?? fallbackValue}</span>
                </div>
                <div className="home-card-item">
                    <span className="label">Success rate</span>
                    <span className="value">{stats.data?.successRate ?? fallbackValue} %</span>
                </div>
            </div>
        </div>
    );
}

async function fetchStats(): Promise<IStats> {
    const response = await axios.get("http://localhost:3000/stats");
    return response.data;
}

export default StatCard;