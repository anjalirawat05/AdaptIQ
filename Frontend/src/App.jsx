import {RouterProvider} from 'react-router-dom'
import {router} from './app_route';
import { AuthProvider } from './Features/Auth/auth.context';
import {InterviewProvider} from './Features/interview/interview.context';


function App() {

  return (
    <AuthProvider>
      <InterviewProvider>
        <RouterProvider router={router} />
      </InterviewProvider>
    </AuthProvider>
  )
}

export default App
   