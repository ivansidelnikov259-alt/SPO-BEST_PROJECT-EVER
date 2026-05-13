import React from 'react'
import { motion } from 'framer-motion'

const VueMicrofrontend = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="vue-container"
      style={{
        width: '100%',
        height: 'calc(100vh - 120px)',
        borderRadius: '24px',
        overflow: 'hidden',
        background: 'transparent'
      }}
    >
      <iframe
        src="http://localhost:5174"
        title="Информационный портал"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '24px',
          background: 'transparent'
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </motion.div>
  )
}

export default VueMicrofrontend