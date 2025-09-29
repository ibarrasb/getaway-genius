import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Edit2, Save, X } from 'lucide-react'

const TripInstanceDetail = () => {
  const { tripId, instanceId } = useParams()
  const locationState = useLocation()
  const stateData = locationState.state || {}
  
  const [trip, setTrip] = useState(stateData.trip || null)
  const [instance, setInstance] = useState(stateData.instance || null)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    trip_start: '',
    trip_end: '',
    stay_expense: 0,
    travel_expense: 0,
    car_expense: 0,
    other_expense: 0,
    activities: []
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(!stateData.trip || !stateData.instance)

  useEffect(() => {
    const fetchTripInstance = async () => {
      if (!trip || !instance) {
        try {
          setFetchLoading(true)
          const { data } = await axios.get(`/api/trips/getaway/${tripId}/instances/${instanceId}`)
          setTrip(data.trip)
          setInstance(data.instance)
        } catch (err) {
          console.error('Error fetching trip instance:', err)
          setFetchLoading(false)
        }
      }
    }
    
    fetchTripInstance()
  }, [tripId, instanceId, trip, instance])

  useEffect(() => {
    if (instance) {
      setFormData({
        trip_start: instance.trip_start ? new Date(instance.trip_start).toISOString().slice(0, 10) : '',
        trip_end: instance.trip_end ? new Date(instance.trip_end).toISOString().slice(0, 10) : '',
        stay_expense: instance.stay_expense || 0,
        travel_expense: instance.travel_expense || 0,
        car_expense: instance.car_expense || 0,
        other_expense: instance.other_expense || 0,
        activities: instance.activities || []
      })
      setFetchLoading(false)
    }
  }, [instance])

  const calculateTotalExpenses = () => {
    const { stay_expense, travel_expense, car_expense, other_expense } = formData
    return (Number(stay_expense) || 0) + (Number(travel_expense) || 0) + 
           (Number(car_expense) || 0) + (Number(other_expense) || 0)
  }

  const formatExpense = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return ''
    }
    const formattedValue = Math.abs(parseFloat(value)).toFixed(2)
    return formattedValue.indexOf('.') === -1 ? `${formattedValue}.00` : formattedValue
  }

  const handleExpenseChange = (key, value) => {
    if (!isNaN(value) || value === '') {
      setFormData(prevState => ({
        ...prevState,
        [key]: value,
      }))
    }
  }

  const handleDateChange = (key, value) => {
    setFormData(prevState => ({
      ...prevState,
      [key]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (trip && trip.instances) {
        const updatedInstances = trip.instances.map((inst, index) => 
          (inst._id === instanceId || index.toString() === instanceId) ? formData : inst
        )
        
        await axios.put(`/api/trips/getaway/${tripId}`, {
          ...trip,
          instances: updatedInstances
        })
      } else {
        await axios.put(`/api/trips/getaway/${tripId}`, formData)
      }
      
      setEditMode(false)
    } catch (error) {
      console.error('Error updating trip instance:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateWithExtraDay = (dateString) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    date.setDate(date.getDate())
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${(date.getDate() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600">Loading trip details...</p>
        </div>
      </div>
    )
  }

  if (!trip || !instance) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Trip instance not found</h2>
          <Link to="/explore" className="text-indigo-600 hover:text-indigo-700">
            Return to Explore
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            to={`/trips/${tripId}`} 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Trip Overview
          </Link>
          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="relative h-48">
              <img 
                src={trip.image_url} 
                alt={trip.location_address}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-6 text-white">
                <h1 className="text-2xl font-bold">
                  {trip.location_address}
                </h1>
                <p className="text-sm opacity-90">
                  {formatDateWithExtraDay(formData.trip_start)} - {formatDateWithExtraDay(formData.trip_end)}
                </p>
              </div>
              
              <div className="absolute top-4 right-4">
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditMode(false)}
                      className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Trip Details & Expenses</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Trip Dates</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    {editMode ? (
                      <input
                        type="date"
                        value={formData.trip_start}
                        onChange={(e) => handleDateChange('trip_start', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      />
                    ) : (
                      <p className="text-slate-600 py-2">{formatDateWithExtraDay(formData.trip_start)}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    {editMode ? (
                      <input
                        type="date"
                        value={formData.trip_end}
                        onChange={(e) => handleDateChange('trip_end', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      />
                    ) : (
                      <p className="text-slate-600 py-2">{formatDateWithExtraDay(formData.trip_end)}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Expense Breakdown</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Stay (Lodging)</label>
                    {editMode ? (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.stay_expense}
                        onChange={(e) => handleExpenseChange('stay_expense', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-slate-600 py-2">${formatExpense(formData.stay_expense)}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Travel Costs</label>
                    {editMode ? (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.travel_expense}
                        onChange={(e) => handleExpenseChange('travel_expense', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-slate-600 py-2">${formatExpense(formData.travel_expense)}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Car Rental</label>
                    {editMode ? (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.car_expense}
                        onChange={(e) => handleExpenseChange('car_expense', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-slate-600 py-2">${formatExpense(formData.car_expense)}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Other Expenses</label>
                    {editMode ? (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.other_expense}
                        onChange={(e) => handleExpenseChange('other_expense', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-slate-600 py-2">${formatExpense(formData.other_expense)}</p>
                    )}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-slate-800">Total Cost:</span>
                      <span className="text-2xl font-bold text-green-600">
                        ${calculateTotalExpenses().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {editMode && (
              <div className="flex gap-3 mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default TripInstanceDetail
