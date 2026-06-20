import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import type { IFailedJob, IFailedJobsData } from "../data/Interfaces.i";
import axios from "axios";

function FailedJobs() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery<IFailedJobsData>({
        queryKey: ["failed-jobs"],
        queryFn: fetchFailedJobs,
        refetchInterval: 5000
    });

    const replayMutation = useMutation({
        mutationFn: replayJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["failed-jobs"] });
        },
    });

    function navigateHome() {
        navigate("/");
    }

    return (
        <div>
            <h2 className="app-header">Failed Jobs</h2>
            <button className="home-button" onClick={navigateHome}>Go to Home</button>

            <div className="home-card">
                <div className="home-card-header">
                    <p className="home-card-title">Failed Jobs</p>
                </div>
                <div className="table-container">
                    {isLoading && <p>Loading...</p>}
                    {isError && <p>Failed to load jobs.</p>}
                    {data && (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Job ID</th>
                                <th>Event Type</th>
                                <th>Data</th>
                                <th>Reason of failure</th>
                                <th>Attempts</th>
                                <th>Timestamp</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.data.map((job: IFailedJob) => (
                                <tr key={job.jobId}>
                                    <td>{job.jobId ?? '-'}</td>
                                    <td>{job.event?.type ?? '-'}</td>
                                    <td className="table-url">{JSON.stringify(job.event?.data)}</td>
                                    <td>{job.failedReason}</td>
                                    <td>{job.attemptsMade}</td>
                                    <td className="table-timestamp">{new Date(job.timestamp).toLocaleString()}</td>
                                    <td>
                                        <button 
                                            className="replay-button"
                                            onClick={() => replayMutation.mutate(job.jobId ?? "")}
                                            disabled={replayMutation.isPending}
                                        >
                                            {replayMutation.isPending ? 'Replaying...' : 'Replay'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>
        </div>
    );
}

async function fetchFailedJobs(): Promise<IFailedJobsData> {
    const response = await axios.get("http://localhost:3000/failed");
    return response.data;
}

async function replayJob(jobId: string) {
    const response = await axios.post(`http://localhost:3000/failed/${jobId}/replay`);
    return response.data;
}

export default FailedJobs;