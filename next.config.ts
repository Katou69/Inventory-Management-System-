import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev requests from any device on common private-network ranges
  // (LAN, phone hotspot, etc.) so features work regardless of the device IP.
  allowedDevOrigins: [
    'localhost',
    '*.local',
    '10.*.*.*',        // 10.0.0.0/8
    '172.16.*.*',      // 172.16.0.0/12 (hotspots, Docker, etc.)
    '172.17.*.*',
    '172.18.*.*',
    '172.19.*.*',
    '172.20.*.*',
    '172.21.*.*',
    '172.22.*.*',
    '172.23.*.*',
    '172.24.*.*',
    '172.25.*.*',
    '172.26.*.*',
    '172.27.*.*',
    '172.28.*.*',
    '172.29.*.*',
    '172.30.*.*',
    '172.31.*.*',
    '192.168.*.*',     // 192.168.0.0/16
  ],
};

export default nextConfig;
