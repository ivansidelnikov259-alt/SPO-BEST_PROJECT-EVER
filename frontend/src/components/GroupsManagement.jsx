import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Edit, Trash2, Search, Music, Calendar, MapPin, 
  TrendingUp, Users, X, Info, Mic, User as UserIcon 
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const GroupsManagement = ({ userRole }) => {
  const [groups, setGroups] = useState([])
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [editingMember, setEditingMember] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupSongs, setGroupSongs] = useState([])
  const [groupMembers, setGroupMembers] = useState([])
  const [availableSongs, setAvailableSongs] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    formation_year: new Date().getFullYear(),
    country: '',
    rating: 0,
    description: ''
  })
  const [memberFormData, setMemberFormData] = useState({
    name: '',
    role: '',
    birth_year: '',
    country: '',
    joined_year: ''
  })

  // Простые иконки для ролей (без дополнительных импортов)
  const getRoleIcon = (role) => {
    if (role.includes('Вокал')) return '🎤'
    if (role.includes('Гитара')) return '🎸'
    if (role.includes('Барабан')) return '🥁'
    if (role.includes('Клавиш')) return '🎹'
    if (role.includes('Бас')) return '🎸'
    return '👤'
  }

  useEffect(() => {
    fetchGroups()
    fetchAllSongs()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await axios.get('http://localhost:8001/groups')
      setGroups(response.data)
    } catch (error) {
      console.error('Error fetching groups:', error)
      toast.error('Ошибка загрузки групп')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllSongs = async () => {
    try {
      const response = await axios.get('http://localhost:8002/songs')
      setSongs(response.data)
    } catch (error) {
      console.error('Error fetching songs:', error)
    }
  }

  const fetchGroupSongs = async (groupId) => {
    try {
      const response = await axios.get(`http://localhost:8002/songs?group_id=${groupId}`)
      setGroupSongs(response.data)
      const notInGroup = songs.filter(song => song.group_id !== groupId)
      setAvailableSongs(notInGroup)
    } catch (error) {
      console.error('Error fetching group songs:', error)
      toast.error('Ошибка загрузки песен группы')
    }
  }

  const fetchGroupMembers = async (groupId) => {
    try {
      const response = await axios.get(`http://localhost:8001/groups/${groupId}/members`)
      setGroupMembers(response.data)
    } catch (error) {
      console.error('Error fetching group members:', error)
      toast.error('Ошибка загрузки состава группы')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingGroup) {
        await axios.put(`http://localhost:8001/groups/${editingGroup.id}`, formData)
        toast.success('Группа обновлена')
      } else {
        await axios.post('http://localhost:8001/groups', formData)
        toast.success('Группа создана')
      }
      fetchGroups()
      closeModal()
    } catch (error) {
      console.error('Error saving group:', error)
      toast.error(error.response?.data?.detail || 'Ошибка сохранения')
    }
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`Удалить группу "${name}"?`)) {
      try {
        await axios.delete(`http://localhost:8001/groups/${id}`)
        toast.success('Группа удалена')
        fetchGroups()
      } catch (error) {
        console.error('Error deleting group:', error)
        toast.error('Ошибка удаления')
      }
    }
  }

  const handleMemberSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingMember) {
        await axios.put(`http://localhost:8001/groups/members/${editingMember.id}`, memberFormData)
        toast.success('Участник обновлен')
      } else {
        await axios.post('http://localhost:8001/groups/members', {
          ...memberFormData,
          group_id: selectedGroup.id
        })
        toast.success('Участник добавлен')
      }
      await fetchGroupMembers(selectedGroup.id)
      closeMemberModal()
    } catch (error) {
      console.error('Error saving member:', error)
      toast.error('Ошибка сохранения')
    }
  }

  const handleDeleteMember = async (memberId, memberName) => {
    if (window.confirm(`Удалить участника "${memberName}"?`)) {
      try {
        await axios.delete(`http://localhost:8001/groups/members/${memberId}`)
        toast.success('Участник удален')
        await fetchGroupMembers(selectedGroup.id)
      } catch (error) {
        console.error('Error deleting member:', error)
        toast.error('Ошибка удаления')
      }
    }
  }

  const addSongToGroup = async (songId) => {
    try {
      const song = availableSongs.find(s => s.id === songId)
      if (song) {
        await axios.put(`http://localhost:8002/songs/${songId}`, {
          ...song,
          group_id: selectedGroup.id
        })
        toast.success('Песня добавлена в репертуар')
        await fetchGroupSongs(selectedGroup.id)
        await fetchAllSongs()
      }
    } catch (error) {
      console.error('Error adding song:', error)
      toast.error('Ошибка добавления песни')
    }
  }

  const removeSongFromGroup = async (songId) => {
    try {
      const song = groupSongs.find(s => s.id === songId)
      if (song) {
        await axios.put(`http://localhost:8002/songs/${songId}`, {
          ...song,
          group_id: null
        })
        toast.success('Песня удалена из репертуара')
        await fetchGroupSongs(selectedGroup.id)
        await fetchAllSongs()
      }
    } catch (error) {
      console.error('Error removing song:', error)
      toast.error('Ошибка удаления песни')
    }
  }

  const openModal = (group = null) => {
    if (group) {
      setEditingGroup(group)
      setFormData({
        name: group.name,
        formation_year: group.formation_year,
        country: group.country,
        rating: group.rating,
        description: group.description || ''
      })
    } else {
      setEditingGroup(null)
      setFormData({
        name: '',
        formation_year: new Date().getFullYear(),
        country: '',
        rating: 0,
        description: ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingGroup(null)
  }

  const openMemberModal = (member = null) => {
    if (member) {
      setEditingMember(member)
      setMemberFormData({
        name: member.name,
        role: member.role,
        birth_year: member.birth_year || '',
        country: member.country || '',
        joined_year: member.joined_year || ''
      })
    } else {
      setEditingMember(null)
      setMemberFormData({
        name: '',
        role: '',
        birth_year: '',
        country: '',
        joined_year: ''
      })
    }
    setIsMemberModalOpen(true)
  }

  const closeMemberModal = () => {
    setIsMemberModalOpen(false)
    setEditingMember(null)
  }

  const openGroupDetails = async (group) => {
    setSelectedGroup(group)
    await Promise.all([
      fetchGroupSongs(group.id),
      fetchGroupMembers(group.id)
    ])
  }

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.country.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-4xl font-display font-bold text-white">Управление группами</h1>
          <p className="text-purple-300 mt-2">Добавление, редактирование и удаление групп</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal()}
          className="btn-primary px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Добавить группу
        </motion.button>
      </div>

      <div className="glass-card p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Поиск по названию или стране..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-dark w-full pl-10 pr-4 py-3 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredGroups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card-light p-6 hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
              onClick={() => openGroupDetails(group)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">{group.name}</h3>
                  <p className="text-purple-300 text-sm mt-1">{group.country}</p>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {userRole === 'admin' && (
                    <>
                      <button
                        onClick={() => openModal(group)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(group.id, group.name)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">Основана: {group.formation_year}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">Рейтинг: {group.rating}/100</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Music className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Песен: {songs.filter(s => s.group_id === group.id).length}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">Участников: {groupMembers.length}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${group.rating}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Модальное окно для деталей группы */}
      <AnimatePresence>
        {selectedGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedGroup(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-6xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">{selectedGroup.name}</h2>
                <button onClick={() => setSelectedGroup(null)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Описание группы */}
              <div className="mb-6 p-4 glass-card">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">О группе</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  {selectedGroup.description || 'Нет описания'}
                </p>
                <div className="mt-3 flex gap-4 text-sm text-gray-400">
                  <span>📅 Год основания: {selectedGroup.formation_year}</span>
                  <span>🌍 Страна: {selectedGroup.country}</span>
                  <span>⭐ Рейтинг: {selectedGroup.rating}/100</span>
                </div>
              </div>

              {/* Состав группы */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    Состав группы ({groupMembers.length})
                  </h3>
                  {userRole === 'admin' && (
                    <button
                      onClick={() => openMemberModal()}
                      className="btn-secondary px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Добавить участника
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupMembers.length === 0 ? (
                    <p className="text-gray-400 col-span-full text-center py-4">Нет данных о составе группы</p>
                  ) : (
                    groupMembers.map(member => (
                      <div key={member.id} className="glass-card p-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-xl">
                            {getRoleIcon(member.role)}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{member.name}</h4>
                            <p className="text-purple-300 text-sm">{member.role}</p>
                            {member.joined_year && (
                              <p className="text-gray-500 text-xs">с {member.joined_year}</p>
                            )}
                          </div>
                        </div>
                        {userRole === 'admin' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => openMemberModal(member)}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <Edit className="w-3 h-3 text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteMember(member.id, member.name)}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Репертуар */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Music className="w-5 h-5 text-purple-400" />
                    Текущий репертуар ({groupSongs.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {groupSongs.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">Нет песен в репертуаре</p>
                    ) : (
                      groupSongs.map(song => (
                        <div key={song.id} className="glass-card p-3 flex justify-between items-center">
                          <div>
                            <h4 className="text-white font-medium">{song.title}</h4>
                            <p className="text-gray-400 text-sm">{song.composer} / {song.singer}</p>
                          </div>
                          {userRole === 'admin' && (
                            <button
                              onClick={() => removeSongFromGroup(song.id)}
                              className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {userRole === 'admin' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-green-400" />
                      Добавить песни ({availableSongs.length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                      {availableSongs.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">Нет доступных песен</p>
                      ) : (
                        availableSongs.map(song => (
                          <div key={song.id} className="glass-card p-3 flex justify-between items-center">
                            <div>
                              <h4 className="text-white font-medium">{song.title}</h4>
                              <p className="text-gray-400 text-sm">{song.composer} / {song.singer}</p>
                            </div>
                            <button
                              onClick={() => addSongToGroup(song.id)}
                              className="p-1 hover:bg-green-500/20 rounded-lg transition-colors"
                            >
                              <Plus className="w-4 h-4 text-green-400" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно для редактирования группы */}
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
                {editingGroup ? 'Редактировать группу' : 'Новая группа'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Название группы</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-dark w-full px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Год основания</label>
                  <input
                    type="number"
                    value={formData.formation_year}
                    onChange={(e) => setFormData({ ...formData, formation_year: parseInt(e.target.value) })}
                    className="input-dark w-full px-4 py-2 text-white"
                    min="1900"
                    max={new Date().getFullYear()}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Страна</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="input-dark w-full px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Рейтинг (0-100)</label>
                  <input
                    type="number"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                    className="input-dark w-full px-4 py-2 text-white"
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Описание группы</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-dark w-full px-4 py-2 text-white resize-none"
                    rows="4"
                    placeholder="Краткое описание группы..."
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
                    {editingGroup ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно для добавления/редактирования участника */}
      <AnimatePresence>
        {isMemberModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeMemberModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                {editingMember ? 'Редактировать участника' : 'Новый участник'}
              </h2>
              <form onSubmit={handleMemberSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Имя</label>
                  <input
                    type="text"
                    value={memberFormData.name}
                    onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                    className="input-dark w-full px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Роль</label>
                  <select
                    value={memberFormData.role}
                    onChange={(e) => setMemberFormData({ ...memberFormData, role: e.target.value })}
                    className="input-dark w-full px-4 py-2 text-white"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)'}}
                    required
                  >
                    <option value="">Выберите роль</option>
                    <option value="Вокалист">Вокалист</option>
                    <option value="Вокалистка">Вокалистка</option>
                    <option value="Гитарист">Гитарист</option>
                    <option value="Гитаристка">Гитаристка</option>
                    <option value="Барабанщик">Барабанщик</option>
                    <option value="Барабанщица">Барабанщица</option>
                    <option value="Басист">Басист</option>
                    <option value="Клавишник">Клавишник</option>
                    <option value="Клавишница">Клавишница</option>
                    <option value="Скрипач">Скрипач</option>
                    <option value="Флейтист">Флейтист</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Год рождения</label>
                  <input
                    type="number"
                    value={memberFormData.birth_year}
                    onChange={(e) => setMemberFormData({ ...memberFormData, birth_year: e.target.value })}
                    className="input-dark w-full px-4 py-2 text-white"
                    min="1950"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Страна</label>
                  <input
                    type="text"
                    value={memberFormData.country}
                    onChange={(e) => setMemberFormData({ ...memberFormData, country: e.target.value })}
                    className="input-dark w-full px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Год вступления в группу</label>
                  <input
                    type="number"
                    value={memberFormData.joined_year}
                    onChange={(e) => setMemberFormData({ ...memberFormData, joined_year: e.target.value })}
                    className="input-dark w-full px-4 py-2 text-white"
                    min="1980"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeMemberModal}
                    className="flex-1 btn-secondary py-2 rounded-xl text-white"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary py-2 rounded-xl text-white"
                  >
                    {editingMember ? 'Сохранить' : 'Добавить'}
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

export default GroupsManagement