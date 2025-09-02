import React from 'react'
import './AnimatedWeatherIcon.scss'

interface AnimatedWeatherIconProps {
  weather: string
  size?: 'small' | 'medium' | 'large'
}

const CloudSVG = ({ cloudPathId }: { cloudPathId: string }) => (
  <svg 
    className="icon__cloud-svg" 
    xmlns="http://www.w3.org/2000/svg" 
    xmlnsXlink="http://www.w3.org/1999/xlink" 
    style={{ position: 'absolute', width: 0, height: 0 }} 
    viewBox="0 0 200 500"
    aria-hidden="true"
  >
    <defs>
      <clipPath id={cloudPathId}>
        <path d=" M 146.5 293 C 65.644 293 0 227.356 0 146.5 C 0 65.644 65.644 0 146.5 0 C 205.641 0 256.643 35.12 279.772 85.624 C 293.416 79.445 308.559 76 324.5 76 C 384.383 76 433 124.617 433 184.5 C 433 244.383 384.383 293 324.5 293 L 324.5 293 C 324.5 293 324.5 293 324.5 293 L 146.5 293 Z" fill="currentColor"/>
      </clipPath>
    </defs>
  </svg>
)

export const AnimatedWeatherIcon = ({ weather, size = 'medium' }: AnimatedWeatherIconProps) => {
  const sizeClass = `animated-weather--${size}`
  
  // Generate unique ID for each icon instance to avoid SVG conflicts
  const cloudPathId = React.useMemo(() => `cloud-path-${Math.random().toString(36).substr(2, 9)}`, [])
  
  const renderWeatherIcon = () => {
    switch (weather) {
      case 'sunny':
      case 'clear-day':
        return (
          <div className={`weather weather--sun ${sizeClass}`}>
            <div className="icon">
              <div className="icon__sun">
                <div className="icon__sun-lights">
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                </div>
              </div>   
              <div className="icon__cloud" style={{ clipPath: `url(#${cloudPathId})` }}>
                <div className="icon__cloud-reflect icon__cloud-reflect--1"></div>
                <div className="icon__cloud-reflect icon__cloud-reflect--2"></div>  
                <CloudSVG cloudPathId={cloudPathId} />
              </div>
              <div className="icon__cloud-shadow"></div>
            </div>
          </div>
        )
      
      case 'partly-cloudy':
      case 'partly-cloudy-day':
        return (
          <div className={`weather weather--sun ${sizeClass}`}>
            <div className="icon">
              <div className="icon__sun">
                <div className="icon__sun-lights">
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                </div>
              </div>   
              <div className="icon__cloud" style={{ clipPath: `url(#${cloudPathId})` }}>
                <div className="icon__cloud-reflect icon__cloud-reflect--1"></div>
                <div className="icon__cloud-reflect icon__cloud-reflect--2"></div>  
                <CloudSVG cloudPathId={cloudPathId} />
              </div>
              <div className="icon__cloud-shadow"></div>
            </div>
          </div>
        )
      
      case 'cloudy':
        return (
          <div className={`weather weather--rainbow ${sizeClass}`}>
            <div className="icon">
              <div className="icon__rainbow">
                  <div className="icon__rainbow-arc"></div>
                  <div className="icon__rainbow-arc"></div>
                  <div className="icon__rainbow-arc"></div>
                  <div className="icon__rainbow-arc"></div>
                  <div className="icon__rainbow-arc"></div>
                  <div className="icon__rainbow-arc"></div>
                  <div className="icon__rainbow-arc"></div>
              </div>   
              <div className="icon__cloud" style={{ clipPath: `url(#${cloudPathId})` }}>
                <div className="icon__cloud-reflect icon__cloud-reflect--1"></div>
                <div className="icon__cloud-reflect icon__cloud-reflect--2"></div>  
                <CloudSVG cloudPathId={cloudPathId} />
              </div>
              <div className="icon__cloud-shadow"></div>
            </div>
          </div>
        )
      
      case 'rainy':
      case 'rain':
        return (
          <div className={`weather weather--thunder ${sizeClass}`}>
            <div className="icon">
              <div className="icon__rain">
                <div className="icon__rain-drops"></div>
              </div>   
              <div className="icon__cloud" style={{ clipPath: `url(#${cloudPathId})` }}>
                <div className="icon__cloud-reflect icon__cloud-reflect--1"></div>
                <div className="icon__cloud-reflect icon__cloud-reflect--2"></div>  
                <CloudSVG cloudPathId={cloudPathId} />
              </div>
              <div className="icon__cloud-shadow"></div>
            </div>
          </div>
        )
      
      case 'thunderstorm':
      case 'thunder':
        return (
          <div className={`weather weather--thunder ${sizeClass}`}>
            <div className="icon">
              <div className="icon__rain">
                <div className="icon__rain-drops"></div>
              </div>   
              <div className="icon__thunder"></div>   
              <div className="icon__cloud" style={{ clipPath: `url(#${cloudPathId})` }}>
                <div className="icon__cloud-reflect icon__cloud-reflect--1"></div>
                <div className="icon__cloud-reflect icon__cloud-reflect--2"></div>  
                <CloudSVG cloudPathId={cloudPathId} />
              </div>
              <div className="icon__cloud-shadow"></div>
            </div>
          </div>
        )
      
      case 'snowy':
      case 'snow':
        return (
          <div className={`weather weather--snow ${sizeClass}`}>
            <div className="icon">
              <div className="icon__snow">
                <div className="icon__snow-flakes"></div>
              </div>   
              <div className="icon__cloud" style={{ clipPath: `url(#${cloudPathId})` }}>
                <div className="icon__cloud-reflect icon__cloud-reflect--1"></div>
                <div className="icon__cloud-reflect icon__cloud-reflect--2"></div>  
                <CloudSVG cloudPathId={cloudPathId} />
              </div>
              <div className="icon__cloud-shadow"></div>
            </div>
          </div>
        )
      
      case 'clear-night':
        return (
          <div className={`weather weather--moon ${sizeClass}`}>
            <div className="icon">
              <div className="icon__moon">
                <div className="icon__moon-crater"></div>
                <div className="icon__moon-crater icon__moon-crater--2"></div>
                <div className="icon__moon-crater icon__moon-crater--3"></div>
              </div>
            </div>
          </div>
        )
      
      case 'partly-cloudy-night':
        return (
          <div className={`weather weather--moon ${sizeClass}`}>
            <div className="icon">
              <div className="icon__moon">
                <div className="icon__moon-crater"></div>
                <div className="icon__moon-crater icon__moon-crater--2"></div>
                <div className="icon__moon-crater icon__moon-crater--3"></div>
              </div>
              <div className="icon__cloud" style={{ clipPath: `url(#${cloudPathId})` }}>
                <div className="icon__cloud-reflect icon__cloud-reflect--1"></div>
                <div className="icon__cloud-reflect icon__cloud-reflect--2"></div>  
                <CloudSVG cloudPathId={cloudPathId} />
              </div>
              <div className="icon__cloud-shadow"></div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className={`weather weather--sun ${sizeClass}`}>
            <div className="icon">
              <div className="icon__sun">
                <div className="icon__sun-lights">
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                  <div className="icon__sun-light"></div>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }
  
  return renderWeatherIcon()
}

export default AnimatedWeatherIcon