import React from 'react'
import './VerticalMarquee.scss'

type VerticalMarqueeProps = {
  text: string
  repeatCount?: number
  animationDuration?: number
  animationSpeed?: number
  className?: string
  position?: 'left' | 'right'
}

const VerticalMarquee: React.FC<VerticalMarqueeProps> = ({
  text,
  repeatCount = 20, // More items for continuous flow
  animationDuration,
  animationSpeed = 1,
  className = '',
  position = 'left',
}) => {


  // Calculate the actual animation duration
  const calculatedDuration = animationDuration || 40 / animationSpeed

  // Create continuous text WITHOUT extra symbols between each repeat
  const textItems = Array(repeatCount).fill(text)

  const containerStyle = {
    ...(position === 'right' ? { right: 0, left: 'auto' } : {}),
  }

  return (
    <div 
      className={`vertical-marquee-container ${className}`} 
      style={containerStyle}

    >
      <div 
        className="vertical-marquee-content"
        style={{ animationDuration: `${calculatedDuration}s` }}
      >
        {textItems.map((item, index) => (
          <React.Fragment key={`first-${index}`}>
            <div className="vertical-text">
              {item}
            </div>
            <div className="vertical-text vertical-symbols">
              • 🦋 •
            </div>
          </React.Fragment>
        ))}
        {/* Duplicate for seamless loop */}
        {textItems.map((item, index) => (
          <React.Fragment key={`second-${index}`}>
            <div className="vertical-text">
              {item}
            </div>
            <div className="vertical-text vertical-symbols">
              • 🦋 •
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default VerticalMarquee
export { VerticalMarquee }
