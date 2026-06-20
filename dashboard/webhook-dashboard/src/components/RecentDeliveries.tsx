import axios from "axios";
import type { IDeliveryLogs, ILog } from "../data/Interfaces.i";
import { useQuery } from "@tanstack/react-query";

function RecentDeliveries() {
    const { data, isLoading, isError } = useQuery<IDeliveryLogs>({
        queryKey: ["recent-deliveries"],
        queryFn: fetchDeliveries,
        refetchInterval: 5000
    });

    return (
        <div className="home-card">
            <div className="home-card-header">
                <p className="home-card-title">Recent Deliveries</p>
            </div>
            <div className="table-container">
                {isLoading && <p>Loading...</p>}
                {isError && <p>Failed to load deliveries.</p>}
                {data && (
                <table className="table">
                    <thead>
                        <tr>
                            <th>Webhook ID</th>
                            <th>Status</th>
                            <th>Event Type</th>
                            <th>URL</th>
                            <th>Status Code</th>
                            <th>Latency</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.data.map((log: ILog) => (
                            <tr key={log.id}>
                                <td>{log.webhookId}</td>
                                <td>
                                    <span className={log.status === 'success' ? 'status-success' : 'status-failed'}>
                                        {log.status}
                                    </span>
                                </td>
                                <td>{log.eventType}</td>
                                <td className="table-url">{log.url}</td>
                                <td>{log.statusCode ?? '—'}</td>
                                <td>{log.latency}ms</td>
                                <td className="table-timestamp">{new Date(log.timestamp).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                )}
            </div>
        </div>
    );
}

async function fetchDeliveries(): Promise<IDeliveryLogs> {
    const response = await axios.get("http://localhost:3000/logs?page=1&limit=10");
    return response.data;
}

export default RecentDeliveries;