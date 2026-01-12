import { createBrowserRouter } from "react-router-dom";
import App from "./App"
import Signin from "./components/Signin"
import Signup from "./components/Signup"
import Dashboard from "./components/Dashboard"
import PrivateRouter from "./components/PrivateRouter"
import AdminLogin from "./components/AdminLogin"
import AdminDashboard from "./components/AdminDashboard"
import ErrorBoundary from "./components/ErrorBoundary"
import DashboardErrorBoundary from "./components/DashboardErrorBoundary"
import AdminErrorBoundary from "./components/AdminErrorBoundary"

export const router = createBrowserRouter([
    {
        path: "/", 
        element: <ErrorBoundary><App /></ErrorBoundary>
    },
    {
        path: "/signin", 
        element: <ErrorBoundary><Signin /></ErrorBoundary>
    },
    {
        path: "/signup", 
        element: <ErrorBoundary><Signup /></ErrorBoundary>
    },
    {
        path: "/adminpage", 
        element: <ErrorBoundary><AdminLogin /></ErrorBoundary>
    },
    {
        path: "/admin/dashboard", 
        element: <AdminErrorBoundary><AdminDashboard /></AdminErrorBoundary>
    },
    {
        path: "/dashboard", 
        element: (
            <DashboardErrorBoundary>
                <PrivateRouter>
                    <Dashboard />
                </PrivateRouter>
            </DashboardErrorBoundary>
        )
    }
])