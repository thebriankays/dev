'use client'

import React from 'react'
import './before-login.scss'

const BeforeLogin: React.FC = () => {
  return (
    <div className="alien-background">
      {/* Back text layer */}
      <div className="alien-text-back">
        ALIEN<br />INTEGRATIONS
      </div>
      
      {/* Front text layer */}  
      <div className="alien-text-front">
        ALIEN<br />INTEGRATIONS
      </div>
    </div>
  )
}

export default BeforeLogin
