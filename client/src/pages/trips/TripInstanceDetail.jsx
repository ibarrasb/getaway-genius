import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Edit2, Save, X, Calendar, DollarSign } from 'lucide-react'

const TripInstanceDetail = () => {
  const { tripId, instanceId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [trip, setTrip] = useState(null)
  const [instance, setInstance] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    costs: {
      lodging: 0,
      travel: 0,
      carRental: 0,
      activities: [],
      other: []
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (location.state?.trip && location.state?.instance) {
      setTrip(location.state.trip)
      setInstance(location.state.instance)
      setFormData({
        name: location.state.instance.name || '',
        startDate: location.state.instance.startDate || location.state.instance.trip_start || '',
        endDate: location.state.instance.endDate || location.state.instance.trip_end || '',
        costs: location.state.instance.costs || {
          lodging: location.state.instance.stay_expense || 0,
          travel: location.state.instance.travel_expense || 0,
          carRental: location.state.instance.car_expense || 0,
          activities: [],
          other: []
        }
      })
      setLoading(false)
    } else {
      fetchTripAndInstance()
    }
  }, [tripId, instanceId, location.state?.trip, location.state?.instance, fetchTripAndInstance])

  const fetchTripAndInstance = useCallback(async () => {
    try {
      const tripRes = await axios.get(`/api/trips/getaway/${tripId}`)
      setTrip(tripRes.data)
      
      const instanceRes = await axios.get(`/api/instances/${instanceId}`)
      const foundInstance = instanceRes.data
      
      if (foundInstance) {
        setInstance(foundInstance)
        setFormData({
          name: foundInstance.name || '',
          startDate: foundInstance.startDate || '',
          endDate: foundInstance.endDate || '',
          costs: foundInstance.costs || {
            lodging: 0,
            travel: 0,
            carRental: 0,
            activities: [],
            other: []
          }
        })
      }
    } catch (error) {
      console.error('Error fetching trip and instance:', error)
    } finally {
      setLoading(false)
    }
  }, [tripId, instanceId])

  const calculateTotal = () => {
    const costs = formData.costs || {}
    const activitiesTotal = (costs.activities || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const otherTotal = (costs.other || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    
    return (Number(costs.lodging) || 0) + 
           (Number(costs.travel) || 0) + 
           (Number(costs.carRental) || 0) + 
           activitiesTotal + 
           otherTotal
  }

  const formatExpenseValue = (value) => {
    return value === 0 ? '' : value.toString()
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const addActivityExpense = () => {
    const newCosts = { ...formData.costs }
    if (!newCosts.activities) newCosts.activities = []
    newCosts.activities.push({ label: '', amount: 0 })
    setFormData({ ...formData, costs: newCosts })
  }

  const removeActivityExpense = (index) => {
    const newCosts = { ...formData.costs }
    newCosts.activities.splice(index, 1)
    setFormData({ ...formData, costs: newCosts })
  }

  const updateActivityExpense = (index, field, value) => {
    const newCosts = { ...formData.costs }
    if (!newCosts.activities) newCosts.activities = []
    newCosts.activities[index] = { ...newCosts.activities[index], [field]: value }
    setFormData({ ...formData, costs: newCosts })
  }

  const addOtherExpense = () => {
    const newCosts = { ...formData.costs }
    if (!newCosts.other) newCosts.other = []
    newCosts.other.push({ label: '', amount: 0 })
    setFormData({ ...formData, costs: newCosts })
  }

  const removeOtherExpense = (index) => {
    const newCosts = { ...formData.costs }
    newCosts.other.splice(index, 1)
    setFormData({ ...formData, costs: newCosts })
  }

  const updateOtherExpense = (index, field, value) => {
    const newCosts = { ...formData.costs }
    if (!newCosts.other) newCosts.other = []
    newCosts.other[index] = { ...newCosts.other[index], [field]: value }
    setFormData({ ...formData, costs: newCosts })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await axios.patch(`/api/trips/${tripId}/instances/${instanceId}`, formData)
      navigate(`/trips/${tripId}`)
    } catch (error) {
      console.error('Error updating trip instance:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-800">Loading trip instance...</h2>
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
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">
                    {formatDate(instance.startDate || instance.trip_start)} - {formatDate(instance.endDate || instance.trip_end)}
                  </span>
                  {instance.isCommitted && (
                    <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-full">
                      Committed
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-semibold text-slate-800">
                    ${(instance.total || calculateTotal()).toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="absolute top-4 right-4">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
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
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Trip Instance Details</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Instance Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  placeholder="Optional name for this trip instance"
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  disabled={!isEditing}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Lodging</label>
                  <input
                    type="number"
                    value={formatExpenseValue(formData.costs?.lodging || 0)}
                    onChange={(e) => setFormData({
                      ...formData, 
                      costs: { ...formData.costs, lodging: Number(e.target.value) || 0 }
                    })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    placeholder="0"
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Travel</label>
                  <input
                    type="number"
                    value={formatExpenseValue(formData.costs?.travel || 0)}
                    onChange={(e) => setFormData({
                      ...formData, 
                      costs: { ...formData.costs, travel: Number(e.target.value) || 0 }
                    })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    placeholder="0"
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Car Rental</label>
                  <input
                    type="number"
                    value={formatExpenseValue(formData.costs?.carRental || 0)}
                    onChange={(e) => setFormData({
                      ...formData, 
                      costs: { ...formData.costs, carRental: Number(e.target.value) || 0 }
                    })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    placeholder="0"
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Activities</label>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={addActivityExpense}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      + Add Activity
                    </button>
                  )}
                </div>
                {(formData.costs?.activities || []).map((activity, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={activity.label || ''}
                      onChange={(e) => updateActivityExpense(index, 'label', e.target.value)}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2"
                      placeholder="Activity name"
                      disabled={!isEditing}
                    />
                    <input
                      type="number"
                      value={formatExpenseValue(activity.amount || 0)}
                      onChange={(e) => updateActivityExpense(index, 'amount', Number(e.target.value) || 0)}
                      className="w-24 border border-slate-300 rounded-lg px-3 py-2"
                      placeholder="0"
                      disabled={!isEditing}
                    />
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeActivityExpense(index)}
                        className="text-red-600 hover:text-red-700 px-2"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Other Expenses</label>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={addOtherExpense}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      + Add Other
                    </button>
                  )}
                </div>
                {(formData.costs?.other || []).map((other, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={other.label || ''}
                      onChange={(e) => updateOtherExpense(index, 'label', e.target.value)}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2"
                      placeholder="Expense name"
                      disabled={!isEditing}
                    />
                    <input
                      type="number"
                      value={formatExpenseValue(other.amount || 0)}
                      onChange={(e) => updateOtherExpense(index, 'amount', Number(e.target.value) || 0)}
                      className="w-24 border border-slate-300 rounded-lg px-3 py-2"
                      placeholder="0"
                      disabled={!isEditing}
                    />
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeOtherExpense(index)}
                        className="text-red-600 hover:text-red-700 px-2"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-800">Total Cost:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${(instance?.total || calculateTotal()).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            {isEditing && (
              <div className="flex gap-3 mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
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
