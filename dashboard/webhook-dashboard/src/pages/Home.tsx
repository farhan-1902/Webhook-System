import NavButtons from "../components/NavButtons";
import RecentDelivieries from "../components/RecentDeliveries";
import StatCard from "../components/StatCard";
import StatCardToday from "../components/StatCardToday";
import "./../App.css"

function Home() {
    return (
        <div>
            <h1 className="app-header">Hooked!</h1>
            <StatCard />
            <StatCardToday />
            <RecentDelivieries />
            <NavButtons />
        </div>
    );
}

export default Home;