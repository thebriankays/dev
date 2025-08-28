import type { StaticImageData } from 'next/image'
import React from 'react'
import type { MediaBlock as MediaBlockProps } from '@/payload-types'
import { MediaBlockClient } from './Component.client'

type Props = MediaBlockProps & {
  breakout?: boolean
  captionClassName?: string
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
}

export const MediaBlock: React.FC<Props> = (props) => {
  return <MediaBlockClient {...props} />
}