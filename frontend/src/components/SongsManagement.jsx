import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Search, Music, User, PenTool, Calendar } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const SongsManagement = ({ userRole }) => {
  const [songs, setSongs] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState('title')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSong, setEditingSong] = useState(null)
  const [selectedComposer, setSelectedComposer] = useState(null)
  const [composerSongs, setComposerSongs] = useState([])
  const [selectedSinger, setSelectedSinger] = useState(null)
  const [singerSongs, setSingerSongs] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    composer: '',
    lyricist: '',
    creation_year: new Date().getFullYear(),
    singer: '',
    group_id: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [songsRes, groupsRes] = await Promise.all([
        axios.get('http://localhost:8002/songs'),
        axios.get('http://localhost:8001/groups')
      ])
      setSongs(songsRes.data)
      setGroups(groupsRes.data)
    } catch (error) {
      toast.error('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  // Функция фильтрации - ПРОСТАЯ И РАБОЧАЯ
  const getFilteredSongs = () => {
    if (searchText === '') {
      return songs
    }
    
    const search = searchText.toLowerCase()
    
    return songs.filter(song => {
      if (filterType === 'title') {
        return song.title?.toLowerCase().includes(search)
      }
      if (filterType === 'composer') {
        return song.composer?.toLowerCase().includes(search)
      }
      if (filterType === 'singer') {
        return song.singer?.toLowerCase().includes(search)
      }
      if (filterType === 'group') {
        return song.group_name?.toLowerCase().includes(search)
      }
      return true
    })
  }

  const filteredSongs = getFilteredSongs()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSong) {
        await axios.put(`http://localhost:8002/songs/${editingSong.id}`, formData)
        toast.success('Песня обновлена')
      } else {
        await axios.post('http://localhost:8002/songs', formData)
        toast.success('Песня создана')
      }
      loadData()
      closeModal()
    } catch (error) {
      toast.error('Ошибка сохранения')
    }
  }

  const handleDelete = async (id, title) => {
    if (window.confirm(`Удалить песню "${title}"?`)) {
      try {
        await axios.delete(`http://localhost:8002/songs/${id}`)
        toast.success('Песня удалена')
        loadData()
      } catch (error) {
        toast.error('Ошибка удаления')
      }
    }
  }

  const openModal = (song = null) => {
    if (song) {
      setEditingSong(song)
      setFormData({
        title: song.title,
        composer: song.composer,
        lyricist: song.lyricist,
        creation_year: song.creation_year,
        singer: song.singer,
        group_id: song.group_id
      })
    } else {
      setEditingSong(null)
      setFormData({
        title: '',
        composer: '',
        lyricist: '',
        creation_year: new Date().getFullYear(),
        singer: '',
        group_id: groups[0]?.id || ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingSong(null)
  }

  const showComposerSongs = async (composer) => {
    try {
      const response = await axios.get(`http://localhost:8002/songs/composer/${encodeURIComponent(composer)}`)
      setComposerSongs(response.data)
      setSelectedComposer(composer)
    } catch (error) {
      toast.error('Ошибка загрузки')
    }
  }

  const showSingerSongs = async (singer) => {
    try {
      const response = await axios.get(`http://localhost:8002/songs/singer/${encodeURIComponent(singer)}`)
      setSingerSongs(response.data)
      setSelectedSinger(singer)
    } catch (error) {
      toast.error('Ошибка загрузки')
    }
  }

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
          <h1 className="text-4xl font-display font-bold text-white">Управление песнями</h1>
          <p className="text-purple-300 mt-2">Репертуар и информация о песнях</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal()}
          className="btn-primary px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Добавить песню
        </motion.button>
      </div>

      {/* Панель поиска */}
      <div className="glass-card p-6 mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Введите текст для поиска..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="input-dark w-full pl-10 pr-4 py-3 text-white"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 rounded-xl text-white"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <option value="title" style={{ background: '#1a1a2e' }}>По названию</option>
            <option value="composer" style={{ background: '#1a1a2e' }}>По композитору</option>
            <option value="singer" style={{ background: '#1a1a2e' }}>По исполнителю</option>
            <option value="group" style={{ background: '#1a1a2e' }}>По группе</option>
          </select>
        </div>
        <div className="mt-3 text-sm text-gray-400">
          {searchText ? `🔍 Найдено: ${filteredSongs.length} из ${songs.length}` : `📀 Всего песен: ${songs.length}`}
        </div>
      </div>

      {/* Список песен */}
      {filteredSongs.length === 0 && searchText ? (
        <div className="text-center py-12 glass-card">
          <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Ничего не найдено</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSongs.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.5) }}
              className="glass-card-light p-6 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <Music className="w-8 h-8 text-purple-400 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-white">{song.title}</h3>
                    <p className="text-purple-300 text-sm">{song.group_name || 'Без группы'}</p>
                  </div>
                </div>
                {userRole === 'admin' && (
                  <div className="flex gap-2">
                    <button onClick={() => openModal(song)} className="p-2 hover:bg-white/10 rounded-lg">
                      <Edit className="w-4 h-4 text-blue-400" />
                    </button>
                    <button onClick={() => handleDelete(song.id, song.title)} className="p-2 hover:bg-white/10 rounded-lg">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => showComposerSongs(song.composer)}
                  className="flex items-center gap-2 text-gray-300 hover:text-purple-400 transition-colors text-left"
                >
                  <User className="w-4 h-4 text-pink-400" />
                  <span className="text-sm break-all">Композитор: {song.composer}</span>
                </button>
                <div className="flex items-center gap-2 text-gray-300">
                  <PenTool className="w-4 h-4 text-green-400" />
                  <span className="text-sm break-all">Автор: {song.lyricist}</span>
                </div>
                <button
                  onClick={() => showSingerSongs(song.singer)}
                  className="flex items-center gap-2 text-gray-300 hover:text-purple-400 transition-colors text-left"
                >
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="text-sm break-all">Исполнитель: {song.singer}</span>
                </button>
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">Год: {song.creation_year}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Модальное окно - песни композитора */}
      {selectedComposer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedComposer(null)}>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-4">Песни: {selectedComposer}</h2>
            <div className="space-y-3">
              {composerSongs.map(song => (
                <div key={song.id} className="glass-card p-4">
                  <h3 className="text-lg font-semibold text-white">{song.title}</h3>
                  <p className="text-purple-300 text-sm">{song.group_name}</p>
                  <p className="text-gray-400 text-sm">{song.singer} ({song.creation_year})</p>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedComposer(null)} className="mt-6 btn-primary px-6 py-2 rounded-xl text-white">Закрыть</button>
          </div>
        </div>
      )}

      {/* Модальное окно - песни исполнителя */}
      {selectedSinger && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedSinger(null)}>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-4">Песни: {selectedSinger}</h2>
            <div className="space-y-3">
              {singerSongs.map(song => (
                <div key={song.id} className="glass-card p-4">
                  <h3 className="text-lg font-semibold text-white">{song.title}</h3>
                  <p className="text-purple-300 text-sm">{song.group_name}</p>
                  <p className="text-gray-400 text-sm">{song.composer} ({song.creation_year})</p>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedSinger(null)} className="mt-6 btn-primary px-6 py-2 rounded-xl text-white">Закрыть</button>
          </div>
        </div>
      )}

      {/* Модальное окно добавления/редактирования */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-4">{editingSong ? 'Редактировать' : 'Новая песня'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Название" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="input-dark w-full px-4 py-2 text-white" required />
              <input type="text" placeholder="Композитор" value={formData.composer} onChange={(e) => setFormData({...formData, composer: e.target.value})} className="input-dark w-full px-4 py-2 text-white" required />
              <input type="text" placeholder="Автор текста" value={formData.lyricist} onChange={(e) => setFormData({...formData, lyricist: e.target.value})} className="input-dark w-full px-4 py-2 text-white" required />
              <input type="number" placeholder="Год создания" value={formData.creation_year} onChange={(e) => setFormData({...formData, creation_year: parseInt(e.target.value)})} className="input-dark w-full px-4 py-2 text-white" required />
              <input type="text" placeholder="Исполнитель" value={formData.singer} onChange={(e) => setFormData({...formData, singer: e.target.value})} className="input-dark w-full px-4 py-2 text-white" required />
              <select value={formData.group_id} onChange={(e) => setFormData({...formData, group_id: parseInt(e.target.value)})} className="input-dark w-full px-4 py-2 text-white">
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 btn-secondary py-2 rounded-xl text-white">Отмена</button>
                <button type="submit" className="flex-1 btn-primary py-2 rounded-xl text-white">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SongsManagement