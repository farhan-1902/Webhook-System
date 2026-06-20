import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useState } from "react";
import type { IWebhooks, IWebhooksData } from "../data/Interfaces.i";
import axios from "axios";

function Webhooks() {
    const [page, setPage] = useState(1);

    const { data, isLoading, isError } = useQuery<IWebhooksData>({
        queryKey: ["webhooks", page],
        queryFn: () => fetchWebhooks(page),
        refetchInterval: 5000
    });
    
    const navigate = useNavigate();

    function navigateHome() {
        navigate("/");
    }

    return (
        <div>
            <h2 className="app-header">Webhooks</h2>
            <button className="home-button" onClick={navigateHome}>Go to Home</button>

            <div className="home-card">
                <div className="home-card-header">
                    <p className="home-card-title">Webhooks Data</p>
                </div>
                <div className="table-container">
                    {isLoading && <p>Loading...</p>}
                    {isError && <p>Failed to load webhooks.</p>}
                    {data && (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Webhook ID</th>
                                <th>URL</th>
                                <th>Events</th>
                                <th>Secret</th>
                                <th>API Key</th>
                                <th>Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.data.map((webhook: IWebhooks) => (
                                <tr key={webhook.id}>
                                    <td>{webhook.id}</td>
                                    <td className="table-url">{webhook.url}</td>
                                    <td>{webhook.events}</td>
                                    <td>{webhook.secret ?? '—'}</td>
                                    <td>{webhook.apiKey}</td>
                                    <td className="table-timestamp">{new Date(webhook.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                </div>

                {data && (
                    <div className="pagination-controls">
                        <button 
                            onClick={() => setPage(p => p - 1)} 
                            disabled={page <= 1}
                        >
                            Previous
                        </button>
                        <span>Page {data.pagination.page} of {data.pagination.totalPages}</span>
                        <button 
                            onClick={() => setPage(p => p + 1)} 
                            disabled={page >= data.pagination.totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

async function fetchWebhooks(page: number): Promise<IWebhooksData> {
    const response = await axios.get(`http://localhost:3000/webhooks?page=${page}&limit=20`);
    return response.data;
}

export default Webhooks;