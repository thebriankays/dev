/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { webpack, isServer }) => {
    // Add shader file loader
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: 'asset/source',
    })

    // Fix for Node.js dependencies in the browser (needed by various packages)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        buffer: false,
        http: false,
        https: false,
        zlib: false,
        stream: false,
        url: false,
        util: false,
        assert: false,
        process: false,
      }
    }

    return config
  },
}

export default nextConfig
