import {useState, useEffect} from 'react';
import axios from 'axios'

function UserAPI(token) {
    const [isLogged, setIsLogged] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const [callback, setCallback] = useState(false)
    const [fname, setfName] = useState([])
    // const [name, setlName] = useState([])
    const [email, setEmail] = useState([])
    const [iD, setID] = useState([])
    const [data, setData] = useState([])
    

    useEffect(() =>{
        if(token){
            const getUser = async () =>{
                try {
                    const res = await axios.get('/api/user/infor', {
                        headers: {Authorization: token}
                    })
                    setData(res.data)
                    setID(res.data._id.split(' ')[0])
                    setfName(res.data.fname.split(' ')[0])
                    setEmail(res.data.email.split(' ')[0])
                    setIsLogged(true)
                    res.data.role === 1 ? setIsAdmin(true) : setIsAdmin(false)
                    
                } catch (err) {
                    alert(err.response.data.msg)
                    
                }
            }
            getUser()
        }

    },[token])

    // const addTrip = async (posts) => {
    //     if(!isLogged) return alert("Please login")

    //         setTrip([...vacation, {...trip}])

    //         await axios.patch('/user/addpost', {trip: [...vacation, {...trip}]}, {
    //             headers: {Authorization: token}
    //         })
    // }

    return {
        isLogged: [isLogged, setIsLogged],
        isAdmin: [isAdmin, setIsAdmin],
        callback: [callback, setCallback],
        fname: [fname, setfName],
        email: [email, setEmail],
        userID: [iD, setID],
        userData: [data, setData]
    }
}

export default UserAPI