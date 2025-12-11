#!/bin/bash
# Script to flash Jetson Orin Nano 8GB Dev Kit with JetPack 6.0 (L4T R36.3.0)
# Run this in your Ubuntu VM after downloading BSP and rootfs to the same dir

set -e

BSP_FILE=\"Jetson_Linux_R36.3.0_aarch64.tbz2\"
ROOTFS_FILE=\"Tegra_Linux_Sample-Root-Filesystem_R36.3.0_aarch64.tbz2\"

echo \"Checking files...\"
if [ ! -f \"$BSP_FILE\" ]; then
  echo \"Missing $BSP_FILE - download from NVIDIA\"
  exit 1
fi
if [ ! -f \"$ROOTFS_FILE\" ]; then
  echo \"Missing $ROOTFS_FILE - download from NVIDIA\"
  exit 1
fi

echo \"Extracting BSP...\"
tar -xjf $BSP_FILE

echo \"Extracting rootfs...\"
cd Linux_for_Tegra
sudo tar -xjf ../$ROOTFS_FILE

echo \"Applying binaries...\"
sudo ./apply_binaries.sh

echo \"Setup complete. Now put Jetson Orin Nano in recovery mode and run:\"
echo \"sudo ./flash.sh jetson-orin-nano-devkit internal\"

echo \"After flashing, boot Jetson and configure NVMe boot if needed.\"