import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { IStatsToday } from "../data/Interfaces.i";
import "./../App.css";


function StatCardToday() {
    const stats = useQuery<IStatsToday>({
        queryKey: ["stats-today"],
        queryFn: fetchStats,
        retry: 5,
        refetchInterval: 5000
    });

    const fallbackValue: string = "Not found";

    return (
        <div className="home-card">
            <div className="home-card-header">
                <p className="home-card-title">Today's Overview</p>
            </div>
            <div className="home-card-grid">
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
                    <span className="label">Success rate</span>
                    <span className="value">{stats.data?.successRate ?? fallbackValue} %</span>
                </div>
            </div>
        </div>
    );
}

async function fetchStats(): Promise<IStatsToday> {
    const response = await axios.get("http://localhost:3000/stats/today");
    return response.data;
}

export default StatCardToday;