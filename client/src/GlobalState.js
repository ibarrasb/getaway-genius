import axios from 'axios'
import React, {createContext, useEffect, useState} from 'react'
import UserAPI from './api/UserAPI'
// import TripsAPI from './api/TripsAPI'


export const GlobalState = createContext()

export const DataProvider = ({children}) => {
    const [token, setToken] = useState(false)

    const refreshToken = async () => {
        try {
            const res = await axios.get('/api/user/refresh_token');
            setToken(res.data.accesstoken);
        } catch (error) {
            console.log(error)
            console.error("Refresh Token Request Error:", error);
            if (error.response) {
                console.error("Response Data:", error.response.data);
            }
        }
    };
    
         
    useEffect(() =>{
        const firstLogin = localStorage.getItem('firstLogin')
        if(firstLogin) refreshToken()
    }, [])

const state = {
    token: [token, setToken],
    UserAPI: UserAPI(token)
    // TripsAPI: TripsAPI()

}
    return (
        <GlobalState.Provider value={state}>
        {children}
        </GlobalState.Provider>
    )
}