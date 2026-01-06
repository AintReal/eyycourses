import { createBrowserRouter } from "react-router-dom";
import App from "./App"
import Signin from "./components/Signin"
import Signup from "./components/Signup"
import Dashboard from "./components/Dashboard"
import PrivateRouter from "./components/PrivateRouter"
import AdminLogin from "./components/AdminLogin"
import AdminDashboard from "./components/AdminDashboard"

export const router = createBrowserRouter([
    {path: "/", element: <App />},
    {path: "/signin", element: <Signin />},
    {path: "/signup", element: <Signup />},
    {path: "/adminpage", element: <AdminLogin />},
    {path: "/admin/dashboard", element: <AdminDashboard />},
    {path: "/dashboard", element: 
    <PrivateRouter>
<Dashboard />
    </PrivateRouter>       
    }
])