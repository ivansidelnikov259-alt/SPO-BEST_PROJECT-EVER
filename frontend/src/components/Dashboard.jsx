import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Music, Calendar, TrendingUp, Star, MapPin, Clock, Trophy } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import axios from 'axios'
import toast from 'react-hot-toast'

const Dashboard = ({ userRole }) => {
  const [stats, setStats] = useState({ groups: 0, songs: 0, tours: 0 })
  const [popularGroup, setPopularGroup] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [groupsRes, songsRes, toursRes, popularRes] = await Promise.all([
        axios.get('http://localhost:8001/groups'),
        axios.get('http://localhost:8002/songs'),
        axios.get('http://localhost:8003/api/tours'),
        axios.get('http://localhost:8001/groups/popular/top')
      ])
      setStats({
        groups: groupsRes.data.length,
        songs: songsRes.data.length,
        tours: toursRes.data.length
      })
      setPopularGroup(popularRes.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const chartData = [
    { name: 'Группы', count: stats.groups, color: '#a855f7' },
    { name: 'Песни', count: stats.songs, color: '#7c3aed' },
    { name: 'Гастроли', count: stats.tours, color: '#c084fc' },
  ]

  const COLORS = ['#a855f7', '#7c3aed', '#c084fc']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-display font-bold text-white">Панель управления</h1>
        <p className="text-purple-300 mt-2">Добро пожаловать в систему управления музыкальными группами</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Всего групп</p>
              <p className="text-4xl font-bold text-white mt-2">{stats.groups}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${Math.min(100, stats.groups * 10)}%` }}></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Всего песен</p>
              <p className="text-4xl font-bold text-white mt-2">{stats.songs}</p>
            </div>
            <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center">
              <Music className="w-6 h-6 text-pink-400" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" style={{ width: `${Math.min(100, stats.songs * 5)}%` }}></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Всего гастролей</p>
              <p className="text-4xl font-bold text-white mt-2">{stats.tours}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${Math.min(100, stats.tours * 20)}%` }}></div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart className="w-5 h-5 text-purple-400" />
            Статистика системы
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #a855f7', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="#a855f7" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {popularGroup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Самая популярная группа
            </h2>
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-5xl font-display font-bold text-white">
                    {popularGroup.name?.charAt(0)}
                  </span>
                </div>
                <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mt-4">{popularGroup.name}</h3>
              <p className="text-purple-300">{popularGroup.country}</p>
              <div className="flex justify-center gap-4 mt-4">
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Рейтинг</p>
                  <p className="text-2xl font-bold text-yellow-400">{popularGroup.rating}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Год основания</p>
                  <p className="text-2xl font-bold text-white">{popularGroup.formation_year}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Песен</p>
                  <p className="text-2xl font-bold text-white">{popularGroup.song_count || 0}</p>
                </div>
              </div>
              
              {/* Репертуар популярной группы */}
              {popularGroup.repertoire && popularGroup.repertoire.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2 justify-center">
                    <Music className="w-4 h-4 text-purple-400" />
                    Репертуар ({popularGroup.repertoire.length} {popularGroup.repertoire.length === 1 ? 'песня' : popularGroup.repertoire.length < 5 ? 'песни' : 'песен'})
                  </h4>
                  <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto">
                    {popularGroup.repertoire.map((song, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white/5 rounded-full text-sm text-gray-300 hover:bg-purple-500/20 transition-colors">
                        {song}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Описание группы */}
              {popularGroup.description && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-gray-400 text-sm italic">"{popularGroup.description}"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Dashboard