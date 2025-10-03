import { useState ,useEffect} from "react";
import { createContext } from "react";
import { toast } from "react-toastify";
import axios from "axios";

export const AppContext= createContext()

export const AppContextProvider=(props)=>{

    const backendUrl=import.meta.env.VITE_BACKEND_URL

    const[isLoggedin,setIsLoggedin]=useState(false)
    const[userData,setUserData]=useState(false)

    const getAutState=async () => {
        try {
            const {data}=await axios.get(backendUrl+'/api/auth/is-auth')
            if(data.sucess){
                setIsLoggedin(true)
                getUserData()
            }
            
        } catch (error) {
            toast.error(error.message)
        }
    }


    //to get users data
    const getUserData=async () => {
        try {
            const {data}=await axios.get(backendUrl + '/api/user/data')
            data.sucess ? setUserData(data.userData) : toast.error(data.message)
        } catch (error) {
            toast.error(error.message)
        }
        
    }

    useEffect(() => {
      getAutState();
    }, [])
    

    


    const value={
        backendUrl,
        isLoggedin,setIsLoggedin,
        userData,setUserData,
        getUserData

    }

    return(
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}