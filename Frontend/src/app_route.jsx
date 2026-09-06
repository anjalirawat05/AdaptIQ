import {createBrowserRouter} from 'react-router-dom';
import Login from './Features/Auth/Pages/Login';
import Register from './Features/Auth/Pages/Register';
import Protected from './Features/Auth/Components/protected';
import Home from './Features/interview/pages/Home';
import Interview from './Features/interview/pages/Interview';
import LiveInterview from './Features/interview/pages/LiveInterview';


export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path : "/",
        element : <Protected>
            <Home/>
        </Protected>
    },
    {
        path : "/interview/:interviewId",
        element : <Protected>
            <Interview/>
        </Protected>
    },
    {
        path : "/interview/:interviewId/live",
        element : <Protected>
            <LiveInterview/>
        </Protected>
    }
])
  