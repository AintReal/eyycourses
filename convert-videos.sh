#!/bin/bash

# Video conversion script for web compatibility
# This converts videos to H.264 + AAC format for universal browser support

# Usage: ./convert-videos.sh input.mp4 [output.mp4]
# If output is not specified, it will create input_converted.mp4

if [ $# -eq 0 ]; then
    echo "Usage: $0 input.mp4 [output.mp4]"
    echo "Example: $0 myvideo.mp4"
    echo "Example: $0 myvideo.mp4 converted.mp4"
    exit 1
fi

INPUT="$1"
OUTPUT="${2:-${INPUT%.*}_converted.mp4}"

if [ ! -f "$INPUT" ]; then
    echo "Error: Input file '$INPUT' not found!"
    exit 1
fi

echo "Converting video to web-compatible format..."
echo "Input: $INPUT"
echo "Output: $OUTPUT"
echo ""

# Convert to H.264 video + AAC audio with web-optimized settings
ffmpeg -i "$INPUT" \
  -c:v libx264 \
  -preset medium \
  -crf 23 \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  -pix_fmt yuv420p \
  "$OUTPUT"

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Conversion successful!"
    echo "Output file: $OUTPUT"
    echo ""
    echo "Original size: $(du -h "$INPUT" | cut -f1)"
    echo "Converted size: $(du -h "$OUTPUT" | cut -f1)"
else
    echo ""
    echo "✗ Conversion failed!"
    exit 1
fi
