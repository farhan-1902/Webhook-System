import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import type { IDeliveryLogs, ILog, ILogFilters, IWebhooksData } from "../data/Interfaces.i";
import axios from "axios";

function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}

function Logs() {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('');
    const [webhookId, setWebhookId] = useState('');
    const [eventTypeInput, setEventTypeInput] = useState('');

    const eventType = useDebouncedValue(eventTypeInput, 500);

    // Reset to page 1 whenever any filter changes
    useEffect(() => {
        setPage(1);
    }, [status, webhookId, eventType]);

    const { data: logs, isLoading, isError } = useQuery<IDeliveryLogs>({
        queryKey: ["logs", page, status, webhookId, eventType],
        queryFn: () => fetchLogs(page, { status, webhookId, eventType }),
        refetchInterval: 5000
    });

    const { data: webhooksData } = useQuery<IWebhooksData>({
        queryKey: ["webhooks-dropdown"],
        queryFn: fetchWebhooks,
        refetchInterval: 5000
    })
    
    const navigate = useNavigate();

    function navigateHome() {
        navigate("/");
    }

    return (
        <div>
            <h2 className="app-header">Logs</h2>
            <button className="home-button" onClick={navigateHome}>Go to Home</button>

            <div className="home-card">
                <div className="home-card-header">
                    <p className="home-card-title">Delivery Logs</p>

                    <div className="filters">
                        <div className="filter-group">
                            <label>Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="">All</option>
                                <option value="success">Success</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Webhook</label>
                            <select value={webhookId} onChange={(e) => setWebhookId(e.target.value)}>
                                <option value="">All</option>
                                {webhooksData?.data.map((webhook) => (
                                    <option key={webhook.id} value={webhook.id}>
                                        {webhook.url}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Event Type</label>
                            <input 
                                type="text" 
                                placeholder="e.g. payment.accepted"
                                value={eventTypeInput}
                                onChange={(e) => setEventTypeInput(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="table-container">
                    {isLoading && <p>Loading...</p>}
                    {isError && <p>Failed to load logs.</p>}
                    {logs && logs.data.length === 0 && <p>No logs match these filters.</p>}
                    {logs && logs.data.length > 0 && (
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
                            {logs.data.map((log: ILog) => (
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

                {logs && (
                    <div className="pagination-controls">
                        <button 
                            onClick={() => setPage(p => p - 1)} 
                            disabled={page <= 1}
                        >
                            Previous
                        </button>
                        <span>Page {logs.pagination.page} of {logs.pagination.totalPages}</span>
                        <button 
                            onClick={() => setPage(p => p + 1)} 
                            disabled={page >= logs.pagination.totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

async function fetchLogs(page: number, filters: ILogFilters): Promise<IDeliveryLogs> {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filters.status) params.append('status', filters.status);
    if (filters.webhookId) params.append('webhookId', filters.webhookId);
    if (filters.eventType) params.append('eventType', filters.eventType);

    const response = await axios.get(`http://localhost:3000/logs?${params}`);
    return response.data;
}

async function fetchWebhooks(): Promise<IWebhooksData> {
    const response = await axios.get(`http://localhost:3000/webhooks?page=1&limit=1000`);
    return response.data;
}

export default Logs;