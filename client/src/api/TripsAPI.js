import {useState, useEffect} from 'react'
import axios from 'axios'

function TripsAPI() {
    const [posts, setPosts] = useState([])
    const [callback, setCallback] = useState(false)
   
    useEffect(() =>{
        
        // Get all the posts made 
        const getTrips = async () => {
            const res = await axios.get('/api/getaway-trip')
            setPosts(res.data)
        }
        getTrips()
    },[callback])
    
    return {
        posts: [posts, setPosts],
        callback: [callback, setCallback]
    }
}

export default TripsAPI