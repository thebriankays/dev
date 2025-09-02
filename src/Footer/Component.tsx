import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

import type { Footer } from '@/payload-types'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { FooterClient } from './Component.client'

export async function Footer() {
  const footerData = await getCachedGlobal('footer', 1)() as Footer

  const navItems = footerData?.navItems || []

  return (
    <FooterClient footer={footerData}>
      <div className="flex flex-col-reverse items-start md:flex-row gap-4 md:items-center">
        <ThemeSelector />
        <nav className="flex flex-col md:flex-row gap-4">
          {navItems.map(({ link }, i) => {
            return <CMSLink className="text-white" key={i} {...link} />
          })}
        </nav>
      </div>
    </FooterClient>
  )
}
