import {useState, useEffect} from 'react'
import axios from 'axios'

function TripsAPI() {
    const [trips, setTrips] = useState([])
    const [callback, setCallback] = useState(false)
   
    useEffect(() =>{
        
        // Get all the posts made 
        const getTrips = async () => {
            const res = await axios.get('/api/trips/getaway-trip')
            setTrips(res.data)
            console.log(res.data)
        }
        getTrips()
    },[callback])
    
    return {
        trip: [trips, setTrips],
        callback: [callback, setCallback]
    }
}

export default TripsAPI