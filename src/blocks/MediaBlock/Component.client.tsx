'use client'

import type { StaticImageData } from 'next/image'
import React from 'react'
import { cn } from '@/utilities/ui'
import RichText from '@/components/RichText'
import type { MediaBlock as MediaBlockProps } from '@/payload-types'
import { Media } from '../../components/Media'
import { WebGLImageComponent } from '@/webgl/components/image'
import { BlockWrapper } from '@/blocks/_shared/BlockWrapper'

type Props = MediaBlockProps & {
  breakout?: boolean
  captionClassName?: string
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
}

export const MediaBlockClient: React.FC<Props> = (props) => {
  const {
    captionClassName,
    className,
    enableGutter = true,
    imgClassName,
    media,
    staticImage,
    disableInnerContainer,
    webglEnabled = false,
    webglSettings = {},
    caption,
    aspectRatio = 'original',
    glassEffect,
    fluidOverlay,
    webglEffects,
  } = props

  let mediaCaption: string | { root: any; [k: string]: unknown } | null | undefined = caption
  if (media && typeof media === 'object' && media.caption && !caption) {
    mediaCaption = media.caption
  }

  // If WebGL is enabled and it's an image, use WebGL component
  if (webglEnabled && media && typeof media === 'object' && media.mimeType?.startsWith('image/')) {
    const imageUrl = media.url
    const imageAlt = media.alt || ''
    const imageWidth = media.width || undefined
    const imageHeight = media.height || undefined

    if (imageUrl) {
      return (
        <BlockWrapper
          className={cn('media-block media-block--webgl', className)}
          glassEffect={glassEffect ? {
            enabled: glassEffect.enabled || false,
            variant: glassEffect.variant || undefined,
            intensity: glassEffect.intensity || undefined,
          } : undefined}
          fluidOverlay={fluidOverlay ? {
            enabled: fluidOverlay.enabled || false,
            intensity: fluidOverlay.intensity || undefined,
            color: fluidOverlay.color || undefined,
          } : undefined}
          webglContent={null} // WebGL content is handled by WebGLImageComponent internally
        >
          <figure 
            className={cn(
              'media-block__figure',
              {
                container: enableGutter,
              }
            )}
            data-aspect-ratio={aspectRatio}
          >
            <div className="media-block__wrapper">
              <WebGLImageComponent
                src={imageUrl}
                alt={imageAlt}
                width={imageWidth}
                height={imageHeight}
                distortion={webglSettings.distortion || undefined}
                parallax={webglSettings.parallax || undefined}
                hover={webglSettings.hover || undefined}
                className={cn('media-block__image', imgClassName)}
                priority={true}
              />
            </div>
            {mediaCaption && (
              <figcaption 
                className={cn(
                  'media-block__caption mt-6',
                  {
                    container: !disableInnerContainer,
                  },
                  captionClassName
                )}
              >
                {!mediaCaption ? null : typeof mediaCaption === 'string' ? (
                  mediaCaption
                ) : (
                  <RichText data={mediaCaption} enableGutter={false} />
                )}
              </figcaption>
            )}
          </figure>
        </BlockWrapper>
      )
    }
  }

  // Regular media block (fallback)
  return (
    <div
      className={cn(
        'media-block',
        {
          container: enableGutter,
        },
        className,
      )}
    >
      {(media || staticImage) && (
        <Media
          imgClassName={cn('border border-border rounded-[0.8rem]', imgClassName)}
          resource={media}
          src={staticImage}
        />
      )}
      {mediaCaption && (
        <div
          className={cn(
            'mt-6',
            {
              container: !disableInnerContainer,
            },
            captionClassName,
          )}
        >
          {typeof mediaCaption === 'string' ? (
            mediaCaption
          ) : (
            <RichText data={mediaCaption} enableGutter={false} />
          )}
        </div>
      )}
    </div>
  )
}