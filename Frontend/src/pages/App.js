import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./Landing";
import Login from "./Login";
import Signup from "./Signup";
import ForgotPassword from "./ForgotPassword";
import Setup from "./Setup";
import Dashboard from "../components/dashboard/Dashboard";
import CategoryDetail from "./CategoryDetail";
import Profile from "./Profile";
import PastData from "./PastData";
import Group from "../components/Group";
import GroupChat from "../components/GroupChat";
import AIInsights from "./AIInsights";

function App() {
  const userId = JSON.parse(localStorage.getItem("user"))?.userID || 1;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/dashboard" element={<Dashboard userId={userId} />} />
        <Route path="/past-data" element={<PastData />} />
        <Route path="/category/:categoryName" element={<CategoryDetail userId={userId} />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/groups" element={<Group />} />
        <Route path="/group/invite/:inviteCode" element={<Group />} />
        <Route path="/groups/:groupId/chat" element={<GroupChat />} />
        <Route path="/ai-insights" element={<AIInsights />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
