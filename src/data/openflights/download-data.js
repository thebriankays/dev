#!/usr/bin/env node

// Script to download and process OpenFlights data
// Run with: node download-data.js

import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_URLS = {
  airlines: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat',
  airports: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat',
  routes: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat'
}

function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${filename}...`)
    
    const file = fs.createWriteStream(filename)
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`))
        return
      }
      
      response.pipe(file)
      
      file.on('finish', () => {
        file.close()
        console.log(`✓ Downloaded ${filename}`)
        resolve()
      })
    }).on('error', (err) => {
      fs.unlink(filename, () => {}) // Delete the file on error
      reject(err)
    })
  })
}

async function downloadAllData() {
  const dataDir = __dirname
  
  try {
    // Download all data files
    for (const [name, url] of Object.entries(DATA_URLS)) {
      const filename = path.join(dataDir, `${name}.dat`)
      await downloadFile(url, filename)
    }
    
    console.log('\nAll data files downloaded successfully!')
    console.log('\nNow run: npx tsx loader.ts')
    
  } catch (error) {
    console.error('Error downloading data:', error)
    process.exit(1)
  }
}

// Run the download
downloadAllData()