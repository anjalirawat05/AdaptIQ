import {createContext, useState} from "react";
import {getMe} from "./Services/auth.api";


export const AuthContext = createContext()


export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true) // to show loading state when user is logging in or registering

    return (
        <AuthContext.Provider value={{user, setUser, loading, setLoading}}>
        {children}
        </AuthContext.Provider>
    )

}