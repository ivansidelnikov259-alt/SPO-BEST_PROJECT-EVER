import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Search, Calendar, MapPin, DollarSign, Music, X, ListMusic } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const ToursManagement = ({ userRole }) => {
  const [tours, setTours] = useState([])
  const [groups, setGroups] = useState([])
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTour, setEditingTour] = useState(null)
  const [selectedTour, setSelectedTour] = useState(null)
  const [tourSongs, setTourSongs] = useState([])
  const [availableSongs, setAvailableSongs] = useState([])
  const [formData, setFormData] = useState({
    program_name: '',
    city: '',
    start_date: '',
    end_date: '',
    avg_ticket_price: 0,
    group_id: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [toursRes, groupsRes, songsRes] = await Promise.all([
        axios.get('http://localhost:8003/api/tours'),
        axios.get('http://localhost:8001/groups'),
        axios.get('http://localhost:8002/songs')
      ])
      setTours(toursRes.data)
      setGroups(groupsRes.data)
      setSongs(songsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const fetchTourSongs = async (tourId, groupId) => {
    try {
      // Получаем песни группы, которые могут быть исполнены на гастролях
      const groupSongs = songs.filter(song => song.group_id === groupId)
      setTourSongs(groupSongs)
      setAvailableSongs(groupSongs)
    } catch (error) {
      console.error('Error fetching tour songs:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingTour) {
        await axios.put(`http://localhost:8003/api/tours/${editingTour.id}`, formData)
        toast.success('Гастроли обновлены')
      } else {
        await axios.post('http://localhost:8003/api/tours', formData)
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
      try {
        await axios.delete(`http://localhost:8003/api/tours/${id}`)
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
        program_name: tour.program_name,
        city: tour.city,
        start_date: tour.start_date,
        end_date: tour.end_date,
        avg_ticket_price: tour.avg_ticket_price,
        group_id: tour.group_id
      })
    } else {
      setEditingTour(null)
      setFormData({
        program_name: '',
        city: '',
        start_date: '',
        end_date: '',
        avg_ticket_price: 0,
        group_id: groups[0]?.id || ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTour(null)
  }

  const openTourDetails = async (tour) => {
    setSelectedTour(tour)
    await fetchTourSongs(tour.id, tour.group_id)
  }

  const filteredTours = tours.filter(tour =>
    tour.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tour.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tour.group_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              onClick={() => openTourDetails(tour)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <Calendar className="w-8 h-8 text-purple-400 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-white">{tour.program_name}</h3>
                    <p className="text-purple-300 text-sm">{tour.group_name}</p>
                  </div>
                </div>
                {userRole === 'admin' && (
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
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">Цена билета: ${tour.avg_ticket_price}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">С: {new Date(tour.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-red-400" />
                  <span className="text-sm">По: {new Date(tour.end_date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <ListMusic className="w-3 h-3" />
                  <span>Длительность: {Math.ceil((new Date(tour.end_date) - new Date(tour.start_date)) / (1000 * 60 * 60 * 24))} дней</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Модальное окно для треклиста гастролей */}
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
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">
                  Треклист: {selectedTour.program_name}
                </h2>
                <button onClick={() => setSelectedTour(null)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <div className="mb-4 p-4 glass-card">
                <p className="text-gray-300">Группа: <span className="text-purple-400">{selectedTour.group_name}</span></p>
                <p className="text-gray-300">Город: <span className="text-purple-400">{selectedTour.city}</span></p>
                <p className="text-gray-300">Даты: <span className="text-purple-400">{new Date(selectedTour.start_date).toLocaleDateString()} - {new Date(selectedTour.end_date).toLocaleDateString()}</span></p>
              </div>

              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-400" />
                Исполняемые песни
              </h3>
              
              <div className="space-y-3">
                {tourSongs.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Нет песен в треклисте</p>
                ) : (
                  tourSongs.map((song, index) => (
                    <div key={song.id} className="glass-card p-4 flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{song.title}</h4>
                        <p className="text-gray-400 text-sm">Композитор: {song.composer} | Исполнитель: {song.singer}</p>
                      </div>
                      <Music className="w-5 h-5 text-purple-400" />
                    </div>
                  ))
                )}
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
                  <label className="block text-gray-300 text-sm mb-2">Группа</label>
                  <select
                    value={formData.group_id}
                    onChange={(e) => setFormData({ ...formData, group_id: parseInt(e.target.value) })}
                    className="input-dark w-full px-4 py-2 text-white"
                    required
                  >
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Дата начала</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="input-dark w-full px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Дата окончания</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="input-dark w-full px-4 py-2 text-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Средняя цена билета ($)</label>
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