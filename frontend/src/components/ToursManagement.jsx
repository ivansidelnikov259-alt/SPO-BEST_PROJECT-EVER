import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Search, Calendar, MapPin, DollarSign, X } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const ToursManagement = () => {
  const { user, isAdmin, userId } = useAuth()
  const [tours, setTours] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTour, setEditingTour] = useState(null)
  const [selectedTour, setSelectedTour] = useState(null)
  const [formData, setFormData] = useState({
    program_name: '',
    city: '',
    date: '',
    start_date: '',
    end_date: '',
    avg_ticket_price: 0,
    currency: 'USD',
    group_id: ''
  })

  const getToken = () => localStorage.getItem('token')
  const getUserRole = () => localStorage.getItem('userRole')
  const getUserId = () => localStorage.getItem('userId')

  const canEditTour = (tour) => {
    if (!tour) return false
    return isAdmin || tour.created_by === parseInt(getUserId())
  }

  const currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'RUB': '₽',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'KRW': '₩',
    'INR': '₹',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'Fr',
    'TRY': '₺'
  }

  const getCurrencySymbol = (currency) => {
    return currencySymbols[currency] || currency || '$'
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = getToken()
    const userRole = getUserRole()
    const userIdNum = getUserId()
    
    try {
      const [toursRes, groupsRes] = await Promise.all([
        axios.get('http://localhost:8003/api/tours', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-User-Id': userIdNum,
            'X-User-Role': userRole
          }
        }),
        axios.get('http://localhost:8001/groups', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      setTours(toursRes.data || [])
      setGroups(groupsRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Ошибка загрузки данных')
      setTours([])
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = getToken()
    const userRole = getUserRole()
    const userIdNum = getUserId()
    
    try {
      if (editingTour) {
        await axios.put(`http://localhost:8003/api/tours/${editingTour.id}`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-User-Id': userIdNum,
            'X-User-Role': userRole
          }
        })
        toast.success('Гастроли обновлены')
      } else {
        await axios.post('http://localhost:8003/api/tours', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-User-Id': userIdNum,
            'X-User-Role': userRole
          }
        })
        toast.success('Гастроли созданы')
      }
      fetchData()
      closeModal()
    } catch (error) {
      console.error('Error saving tour:', error)
      toast.error(error.response?.data?.error || 'Ошибка сохранения')
    }
  }

  const handleDelete = async (id, programName) => {
    if (window.confirm(`Удалить гастроли "${programName}"?`)) {
      const token = getToken()
      const userRole = getUserRole()
      const userIdNum = getUserId()
      
      try {
        await axios.delete(`http://localhost:8003/api/tours/${id}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-User-Id': userIdNum,
            'X-User-Role': userRole
          }
        })
        toast.success('Гастроли удалены')
        fetchData()
      } catch (error) {
        console.error('Error deleting tour:', error)
        toast.error('Ошибка удаления')
      }
    }
  }

  const openModal = (tour = null) => {
    if (tour) {
      setEditingTour(tour)
      setFormData({
        program_name: tour.program_name || '',
        city: tour.city || '',
        date: tour.date || '',
        start_date: tour.start_date || '',
        end_date: tour.end_date || '',
        avg_ticket_price: tour.avg_ticket_price || 0,
        currency: tour.currency || 'USD',
        group_id: tour.group_id || ''
      })
    } else {
      setEditingTour(null)
      setFormData({
        program_name: '',
        city: '',
        date: '',
        start_date: '',
        end_date: '',
        avg_ticket_price: 0,
        currency: 'USD',
        group_id: groups[0]?.id || ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTour(null)
  }

  const filteredTours = tours && tours.length > 0 
    ? tours.filter(tour =>
        tour.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.group_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-white">Управление гастролями</h1>
          <p className="text-purple-300 mt-2">Планирование и управление гастрольными турами</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal()}
          className="btn-primary px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Добавить гастроли
        </motion.button>
      </div>

      <div className="glass-card p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Поиск по названию программы, городу или группе..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-dark w-full pl-10 pr-4 py-3 text-white"
          />
        </div>
      </div>

      {filteredTours.length === 0 && !loading ? (
        <div className="text-center py-12 glass-card">
          <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Нет гастролей</p>
          <button
            onClick={() => openModal()}
            className="mt-4 btn-primary px-4 py-2 rounded-xl text-white"
          >
            Создать первую гастроль
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredTours.map((tour, index) => (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card-light p-6 hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedTour(tour)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-8 h-8 text-purple-400 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold text-white">{tour.program_name}</h3>
                      <p className="text-purple-300 text-sm">{tour.group_name}</p>
                    </div>
                  </div>
                  {canEditTour(tour) && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openModal(tour)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(tour.id, tour.program_name)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span className="text-sm">Город: {tour.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">Дата: {new Date(tour.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <DollarSign className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm">Цена: {getCurrencySymbol(tour.currency)}{tour.avg_ticket_price}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-sm">Тур: {new Date(tour.start_date).toLocaleDateString()} - {new Date(tour.end_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Модальное окно для деталей гастролей */}
      <AnimatePresence>
        {selectedTour && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTour(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">{selectedTour.program_name}</h2>
                <button onClick={() => setSelectedTour(null)} className="p-1 hover:bg-white/10 rounded">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-2">
                <p><span className="text-gray-400">Группа:</span> <span className="text-white">{selectedTour.group_name}</span></p>
                <p><span className="text-gray-400">Город:</span> <span className="text-white">{selectedTour.city}</span></p>
                <p><span className="text-gray-400">Дата концерта:</span> <span className="text-white">{new Date(selectedTour.date).toLocaleDateString()}</span></p>
                <p><span className="text-gray-400">Период тура:</span> <span className="text-white">{new Date(selectedTour.start_date).toLocaleDateString()} - {new Date(selectedTour.end_date).toLocaleDateString()}</span></p>
                <p><span className="text-gray-400">Цена билета:</span> <span className="text-white">{getCurrencySymbol(selectedTour.currency)}{selectedTour.avg_ticket_price}</span></p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно для добавления/редактирования */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                {editingTour ? 'Редактировать гастроли' : 'Новые гастроли'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Название программы</label>
                  <input
                    type="text"
                    value={formData.program_name}
                    onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                    className="input-dark w-full px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Город</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input-dark w-full px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Дата концерта</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-dark w-full px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Группа</label>
                  <select
                    value={formData.group_id}
                    onChange={(e) => setFormData({ ...formData, group_id: parseInt(e.target.value) })}
                    className="input-dark w-full px-4 py-2 text-white"
                    required
                  >
                    <option value="">Выберите группу</option>
                    {groups && groups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Начало тура</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="input-dark w-full px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Окончание тура</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="input-dark w-full px-4 py-2 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Валюта</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="input-dark w-full px-4 py-2 text-white"
                    >
                      <option value="USD">💵 USD ($)</option>
                      <option value="EUR">💶 EUR (€)</option>
                      <option value="RUB">💷 RUB (₽)</option>
                      <option value="GBP">💷 GBP (£)</option>
                      <option value="JPY">💴 JPY (¥)</option>
                      <option value="CNY">💴 CNY (¥)</option>
                      <option value="KRW">💴 KRW (₩)</option>
                      <option value="INR">₹ INR (₹)</option>
                      <option value="CAD">C$ CAD</option>
                      <option value="AUD">A$ AUD</option>
                      <option value="CHF">Fr CHF</option>
                      <option value="TRY">₺ TRY</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Цена билета</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.avg_ticket_price}
                      onChange={(e) => setFormData({ ...formData, avg_ticket_price: parseFloat(e.target.value) })}
                      className="input-dark w-full px-4 py-2 text-white"
                      min="0"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 btn-secondary py-2 rounded-xl text-white"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary py-2 rounded-xl text-white"
                  >
                    {editingTour ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ToursManagement