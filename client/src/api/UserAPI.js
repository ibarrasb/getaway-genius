import {useState, useEffect} from 'react';
import axios from 'axios'

function UserAPI(token) {
    const [isLogged, setIsLogged] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const [callback, setCallback] = useState(false)
    const [name, setName] = useState([])
    const [consoles, setConsoles] =useState([])

    useEffect(() =>{
        if(token){
            const getUser = async () =>{
                try {
                    const res = await axios.get('/api/user/infor', {
                        headers: {Authorization: token}
                    })
                    setName(res.data.name.split(' ')[0])
                    setConsoles(res.data.consoles)
                    setIsLogged(true)
                    res.data.role === 1 ? setIsAdmin(true) : setIsAdmin(false)
                    console.log(res.data)
                    
                } catch (err) {
                    alert(err.response.data.msg)
                    
                }
            }
            getUser()
        }

    },[token])



    return {
        isLogged: [isLogged, setIsLogged],
        isAdmin: [isAdmin, setIsAdmin],
        callback: [callback, setCallback],
        name: [name, setName],
        consoles: [consoles, setConsoles]
    }
}

export default UserAPI