import { useNavigate } from "react-router";
import "./../App.css";

function NavButtons() {
    const navigate = useNavigate();

    function navigateToWebhooks() {
        navigate("/webhooks");
    }

    function navigateToLogs() {
        navigate("/delivery-logs");
    }

    function navigateToFailedJobs() {
        navigate("/failed-jobs");
    }

    return (
        <div className="nav-buttons-container">
            <div>
                <button className="nav-button" onClick={navigateToWebhooks}>Go to Webhooks</button>
            </div>
            <div>
                <button className="nav-button" onClick={navigateToLogs}>Go to Delivery Logs</button>
            </div>
            <div>
                <button className="nav-button" onClick={navigateToFailedJobs}>Go to Failed Jobs</button>
            </div>
        </div>
    );
}

export default NavButtons;