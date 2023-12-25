/** @type {import('next').NextConfig} */

const webpack = require("webpack");
const nextConfig = {
  images: {
    domains: ["fmliqecnrxgzwvucipeu.supabase.co"],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        stream: require.resolve("stream-browserify"),
        crypto: require.resolve("crypto-browserify"),
      };
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        perf_hooks: false,
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser",
        }),
        new webpack.NormalModuleReplacementPlugin(/node:crypto/, resource => {
          resource.request = resource.request.replace(/^node:/, "");
        }),

        new webpack.NormalModuleReplacementPlugin(/^node:/, resource => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      );
    }
    return config;
  },
};

module.exports = nextConfig;
