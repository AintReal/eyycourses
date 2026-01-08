#!/bin/bash

# Batch video conversion script for all videos in a directory
# This converts all video files to H.264 + AAC format for universal browser support

# Usage: ./batch-convert-videos.sh [input_directory] [output_directory]
# Default: converts all videos in current directory and outputs to ./converted/

INPUT_DIR="${1:-.}"
OUTPUT_DIR="${2:-./converted}"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "Batch converting videos to web-compatible format..."
echo "Input directory: $INPUT_DIR"
echo "Output directory: $OUTPUT_DIR"
echo ""

# Counter for tracking progress
total=0
converted=0
failed=0

# Find all video files (mp4, mov, avi, mkv, webm)
for file in "$INPUT_DIR"/*.{mp4,mov,avi,mkv,webm,MP4,MOV,AVI,MKV,WEBM} 2>/dev/null; do
    # Skip if no files found
    [ -e "$file" ] || continue
    
    total=$((total + 1))
    filename=$(basename "$file")
    filename_no_ext="${filename%.*}"
    output_file="$OUTPUT_DIR/${filename_no_ext}_converted.mp4"
    
    echo "[$total] Converting: $filename"
    
    # THE ONLY SAFE WEB COMBO: H.264 Main + yuv420p + AAC
    ffmpeg -i "$file" \
      -c:v libx264 \
      -profile:v main \
      -level 4.0 \
      -pix_fmt yuv420p \
      -movflags +faststart \
      -c:a aac \
      -b:a 128k \
      -y \
      "$output_file" \
      -loglevel error -stats
    
    if [ $? -eq 0 ]; then
        converted=$((converted + 1))
        echo "  ✓ Success: $output_file"
    else
        failed=$((failed + 1))
        echo "  ✗ Failed: $filename"
    fi
    echo ""
done

echo "================================"
echo "Batch conversion complete!"
echo "Total: $total | Converted: $converted | Failed: $failed"
echo "================================"
