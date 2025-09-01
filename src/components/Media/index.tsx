import React, { Fragment } from 'react'
import { cn } from '@/utilities/ui'

import type { Props } from './types'

import { ImageMedia } from './ImageMedia'
import { VideoMedia } from './VideoMedia'

export const Media: React.FC<Props> = (props) => {
  const { className, htmlElement = 'div', resource, fill } = props

  const isVideo = typeof resource === 'object' && resource?.mimeType?.includes('video')
  const Tag = htmlElement || Fragment

  if (htmlElement === null) {
    return (
      <Fragment>
        {isVideo ? <VideoMedia {...props} /> : <ImageMedia {...props} />}
      </Fragment>
    )
  }

  return (
    <Tag
      className={cn(className, fill && 'relative')}
    >
      {isVideo ? <VideoMedia {...props} /> : <ImageMedia {...props} />}
    </Tag>
  )
}
