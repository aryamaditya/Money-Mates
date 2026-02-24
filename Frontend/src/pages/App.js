import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import Setup from "./Setup";
import Dashboard from "../components/dashboard/Dashboard";
import CategoryDetail from "./CategoryDetail";
import Profile from "./Profile";
import Group from "../components/Group";
import InviteGroup from "../components/InviteGroup";
import GroupChat from "../components/GroupChat";

function App() {
  const userId = JSON.parse(localStorage.getItem("user"))?.userID || 1;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/dashboard" element={<Dashboard userId={userId} />} />
        <Route path="/category/:categoryName" element={<CategoryDetail userId={userId} />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/groups" element={<Group />} />
        <Route path="/group/invite/:groupId" element={<InviteGroup />} />
        <Route path="/groups/:groupId/chat" element={<GroupChat />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
